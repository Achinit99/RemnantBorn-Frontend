/**
 * What: Live chat panel with realtime message streaming, database integration, and message sending.
 * Why: Provides real-time community chat with user profiles and persistent message history.
 */
"use client"

import { MessageCircle, SendHorizontal } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import {
  GLOBAL_CHAT_SYNC_CHANNEL,
  GLOBAL_TEXT_CHANNEL,
  MESSAGES_SELECT_WITH_PROFILE,
  MESSAGES_TABLE,
} from "@/components/community/chat-realtime-config"
import type { ChatMessage } from "@/components/community/types"

interface LiveChatPanelProps {
  channel?: string
  messages?: ChatMessage[]
}

const MESSAGE_PAGE_SIZE = 10
const PREVIEW_FALLBACK_LEVEL = 1
const ONLINE_WINDOW_MS = 5 * 60 * 1000
const STATUS_BAR_LIMIT = 6
const HEARTBEAT_INTERVAL_MS = 45 * 1000
const HEARTBEAT_THROTTLE_MS = 20 * 1000

interface ChatParticipant {
  userId: string
  username: string
  avatarUrl: string | null
  lastActiveAt: string | null
  isOnline: boolean
  level: number
}

type ProfileRow = {
  user_id?: string | null
  username?: string | null
  avatar_url?: string | null
  level?: number | null
  last_seen?: string | null
}

type MessageRow = {
  id: string
  user_id: string
  content: string
  channel?: string
  created_at: string
  profiles?: {
    username?: string | null
    avatar_url?: string | null
    level?: number | null
  } | Array<{
    username?: string | null
    avatar_url?: string | null
    level?: number | null
  }> | null
}

export function LiveChatPanel({ channel = "global" }: LiveChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageDraft, setMessageDraft] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingOlder, setIsFetchingOlder] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState("Traveler")
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState(PREVIEW_FALLBACK_LEVEL)
  const [isInitialized, setIsInitialized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [temporarilyHighlightedIds, setTemporarilyHighlightedIds] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messageContainerRef = useRef<HTMLDivElement | null>(null)
  const subscriptionRef = useRef<any>(null)
  const profileSubscriptionRef = useRef<any>(null)
  const presenceSubscriptionRef = useRef<any>(null)
  const oldestTimestampRef = useRef<string | null>(null)
  const shouldAnchorOlderLoadRef = useRef(false)
  const previousScrollHeightRef = useRef(0)
  const heartbeatAtRef = useRef(0)
  const [statusUsers, setStatusUsers] = useState<ChatParticipant[]>([])
  const [onlineUsernames, setOnlineUsernames] = useState<Set<string>>(new Set())

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [])

  const isNearBottom = useCallback(() => {
    const container = messageContainerRef.current
    if (!container) {
      return true
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return distanceFromBottom < 140
  }, [])

  const getInitial = (username: string): string => {
    const trimmed = username.trim()
    return trimmed.length > 0 ? trimmed[0].toUpperCase() : "?"
  }

  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      if (Number.isNaN(date.getTime())) return "just now"
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return "just now"
    }
  }

  const isRecentlySeen = useCallback((lastActiveAt: string | null): boolean => {
    if (typeof lastActiveAt !== "string") {
      return false
    }

    const parsed = new Date(lastActiveAt).getTime()
    if (Number.isNaN(parsed)) {
      return false
    }

    return Date.now() - parsed <= ONLINE_WINDOW_MS
  }, [])

  const updateLastSeen = useCallback(
    async (force = false) => {
      if (!currentUserId) {
        return
      }

      const now = Date.now()
      if (!force && now - heartbeatAtRef.current < HEARTBEAT_THROTTLE_MS) {
        return
      }

      heartbeatAtRef.current = now
      const client = getSupabaseBrowserClient()
      if (!client) {
        return
      }

      const { error: updateError } = await client
        .from("profiles")
        .update({ last_seen: new Date(now).toISOString() })
        .eq("user_id", currentUserId)

      if (updateError) {
        console.error("Failed to update last_seen heartbeat:", updateError)
      }
    },
    [currentUserId]
  )

  const normalizeMessage = useCallback((msg: MessageRow): ChatMessage | null => {
    if (!msg) {
      return null
    }

    const profile = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles
    return {
      id: msg.id,
      user_id: msg.user_id,
      author: profile?.username || "Unknown",
      avatar_url: profile?.avatar_url || null,
      level: profile?.level || PREVIEW_FALLBACK_LEVEL,
      content: msg.content,
      postedAt: formatTime(msg.created_at),
      channel: msg.channel,
      createdAt: msg.created_at,
    }
  }, [])

  const normalizeStatusUser = useCallback((profile: ProfileRow): ChatParticipant => {
    const lastActiveAt = profile.last_seen || null
    const onlineFromLastSeen = isRecentlySeen(lastActiveAt)
    const username = profile.username || "Unknown"
    const userId = profile.user_id || username

    return {
      userId,
      username,
      avatarUrl: profile.avatar_url || null,
      lastActiveAt,
      isOnline: onlineFromLastSeen,
      level: profile.level ?? PREVIEW_FALLBACK_LEVEL,
    }
  }, [isRecentlySeen])

  const fetchStatusUsers = useCallback(async () => {
    try {
      const client = getSupabaseBrowserClient()
      if (!client) {
        return
      }

      const { data, error: profileError } = await client
        .from("profiles")
        .select("user_id, username, avatar_url, level, last_seen")
        .order("last_seen", { ascending: false, nullsFirst: false })
        .limit(STATUS_BAR_LIMIT)

      if (profileError) {
        console.error("Error fetching status users:", profileError.message, profileError.details, profileError.hint, profileError.code)
        return
      }

      const mappedUsers = (data || []).map((row) => normalizeStatusUser(row as ProfileRow))
      setStatusUsers(mappedUsers)
    } catch (err) {
      console.error("Unexpected error fetching status users:", err)
    }
  }, [normalizeStatusUser])

  const subscribeToProfileStatus = useCallback(() => {
    const client = getSupabaseBrowserClient()
    if (!client) {
      return
    }

    profileSubscriptionRef.current = client
      .channel("profiles-status-sync")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        () => {
          void fetchStatusUsers()
        }
      )
      .subscribe()
  }, [fetchStatusUsers])

  const subscribeToPresenceStatus = useCallback(() => {
    const client = getSupabaseBrowserClient()
    if (!client || !currentUserId) {
      return
    }

    const presenceChannel = client.channel(`community-presence:${channel}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    presenceSubscriptionRef.current = presenceChannel

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState() as Record<string, Array<{ username?: unknown }>>
        const nextOnlineUsernames = new Set<string>()

        for (const presences of Object.values(state)) {
          for (const presence of presences) {
            if (typeof presence.username === "string") {
              nextOnlineUsernames.add(presence.username)
            }
          }
        }

        setOnlineUsernames(nextOnlineUsernames)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: currentUserId,
            username: currentUsername,
            online_at: new Date().toISOString(),
          })
        }
      })
  }, [channel, currentUserId, currentUsername])

  // Initialize user auth on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const client = getSupabaseBrowserClient()
        if (!client) {
          console.warn("Supabase client not initialized")
          setIsInitialized(true)
          return
        }

        const { data: { user }, error: userError } = await client.auth.getUser()
        if (userError) {
          console.warn("Auth check failed:", userError.message)
        }

        if (user?.id) {
          setCurrentUserId(user.id)
          console.log("User authenticated:", user.id)

          const { data: profile } = await client
            .from("profiles")
            .select("username, avatar_url, level")
            .eq("user_id", user.id)
            .single()

          if (profile) {
            setCurrentUsername(profile.username || "Traveler")
            setCurrentAvatarUrl(profile.avatar_url || null)
            setCurrentLevel(profile.level ?? PREVIEW_FALLBACK_LEVEL)
          }
        } else {
          console.warn("No authenticated user found")
        }
      } catch (err) {
        console.error("Error initializing auth:", err)
      } finally {
        setIsInitialized(true)
      }
    }

    void initializeAuth()
  }, [])

  const fetchInitialMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      const client = getSupabaseBrowserClient()

      if (!client) {
        setError("Supabase client not initialized")
        return
      }

      // Fetch latest messages first, then reverse for bottom-up rendering.
      const { data: fetchedMessages, error: fetchError } = await client
        .from(MESSAGES_TABLE)
        .select(MESSAGES_SELECT_WITH_PROFILE)
        .eq("channel", channel)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE)

      if (fetchError) {
        console.error("Fetch error object:", fetchError)
        throw fetchError
      }

      if (!fetchedMessages || fetchedMessages.length === 0) {
        console.log("No messages returned from query for channel:", channel)
        setMessages([])
        setError(null)
        setIsLoading(false)
        return
      }

      const mappedMessages: ChatMessage[] = (fetchedMessages || [])
        .map((msg) => normalizeMessage(msg as MessageRow))
        .filter((msg): msg is ChatMessage => msg !== null)
        .reverse()

      const oldestMessage = mappedMessages[0]
      oldestTimestampRef.current = oldestMessage?.createdAt || null
      setHasMoreOlder((fetchedMessages || []).length === MESSAGE_PAGE_SIZE)

      setMessages(mappedMessages)
      setError(null)
    } catch (err) {
      console.error("Error fetching messages:", err.message || err)
      setError("Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }, [channel, normalizeMessage])

  const fetchOlderMessages = useCallback(async () => {
    if (isFetchingOlder || !hasMoreOlder || !oldestTimestampRef.current) {
      return
    }

    try {
      const container = messageContainerRef.current
      if (container) {
        previousScrollHeightRef.current = container.scrollHeight
        shouldAnchorOlderLoadRef.current = true
      }

      setIsFetchingOlder(true)
      const client = getSupabaseBrowserClient()
      if (!client) {
        return
      }

      const { data, error: fetchError } = await client
        .from(MESSAGES_TABLE)
        .select(MESSAGES_SELECT_WITH_PROFILE)
        .eq("channel", channel)
        .lt("created_at", oldestTimestampRef.current)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE)

      if (fetchError) {
        throw fetchError
      }

      const olderMessages = (data || [])
        .map((msg) => normalizeMessage(msg as MessageRow))
        .filter((msg): msg is ChatMessage => msg !== null)
        .reverse()

      if (olderMessages.length === 0) {
        setHasMoreOlder(false)
        return
      }

      oldestTimestampRef.current = olderMessages[0]?.createdAt || oldestTimestampRef.current
      setHasMoreOlder((data || []).length === MESSAGE_PAGE_SIZE)

      setMessages((prev) => {
        const existingIds = new Set(prev.map((message) => message.id))
        const uniqueOlder = olderMessages.filter((message) => !existingIds.has(message.id))
        if (uniqueOlder.length === 0) {
          return prev
        }

        return [...uniqueOlder, ...prev]
      })
    } catch (err) {
      console.error("Error fetching older messages:", err)
    } finally {
      setIsFetchingOlder(false)
    }
  }, [channel, hasMoreOlder, isFetchingOlder, normalizeMessage])

  const handleMessageScroll = useCallback(() => {
    const container = messageContainerRef.current
    if (!container || isFetchingOlder || !hasMoreOlder) {
      if (isNearBottom()) {
        setUnreadCount(0)
      }
      return
    }

    if (container.scrollTop <= 24) {
      void fetchOlderMessages()
    }

    if (isNearBottom()) {
      setUnreadCount(0)
    }
  }, [fetchOlderMessages, hasMoreOlder, isFetchingOlder, isNearBottom])

  const jumpToLatest = useCallback(() => {
    scrollToBottom()
    setUnreadCount(0)
  }, [scrollToBottom])

  const subscribeToMessages = useCallback(() => {
    const client = getSupabaseBrowserClient()
    if (!client) {
      console.error("Supabase client not available for subscription")
      return
    }

    const channelFilter = channel.toLowerCase() === GLOBAL_TEXT_CHANNEL ? GLOBAL_TEXT_CHANNEL : channel

    subscriptionRef.current = client
      .channel(channelFilter === GLOBAL_TEXT_CHANNEL ? GLOBAL_CHAT_SYNC_CHANNEL : `messages:${channelFilter}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: MESSAGES_TABLE,
          filter: `channel=eq.${channelFilter}`,
        },
        async (payload) => {
          try {
            const newMsg = payload.new as MessageRow
            console.log("New message received:", newMsg)
            const shouldStickToBottom = isNearBottom()

            // Fetch profile data for the new message
            if (newMsg.user_id) {
              const { data: profile } = await client
                .from("profiles")
                .select("username, avatar_url, level")
                .eq("user_id", newMsg.user_id)
                .single()

              if (profile) {
                const mappedMessage: ChatMessage = {
                  id: newMsg.id,
                  user_id: newMsg.user_id,
                  author: profile.username || "Unknown",
                  avatar_url: profile.avatar_url || null,
                  level: profile.level ?? PREVIEW_FALLBACK_LEVEL,
                  content: newMsg.content,
                  postedAt: "just now",
                  channel: newMsg.channel,
                  createdAt: newMsg.created_at,
                }

                setMessages((prev) => {
                  if (prev.some((message) => message.id === mappedMessage.id)) {
                    return prev
                  }

                  return [...prev, mappedMessage]
                })

                setTemporarilyHighlightedIds((currentIds) => {
                  if (currentIds.includes(mappedMessage.id)) {
                    return currentIds
                  }

                  return [...currentIds, mappedMessage.id]
                })

                window.setTimeout(() => {
                  setTemporarilyHighlightedIds((currentIds) =>
                    currentIds.filter((messageId) => messageId !== mappedMessage.id)
                  )
                }, 2000)

                if (shouldStickToBottom) {
                  requestAnimationFrame(() => {
                    scrollToBottom()
                  })
                } else {
                  setUnreadCount((count) => count + 1)
                }

                void fetchStatusUsers()
              }
            }
          } catch (err) {
            console.error("Error processing new message:", err)
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${channelFilter}:`, status)
      })
  }, [channel, fetchStatusUsers, isNearBottom, scrollToBottom])

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const messageContent = messageDraft.trim()
      if (!messageContent) {
        return
      }

      try {
        setIsSending(true)
        setError(null)
        const client = getSupabaseBrowserClient()

        if (!client) {
          setError("Supabase client not initialized")
          return
        }

        // Fetch current user fresh
        const { data: { user }, error: userError } = await client.auth.getUser()
        if (userError || !user?.id) {
          console.error("Failed to get user:", userError?.message || "No user found")
          setError("User authentication failed")
          return
        }

        const optimisticId = `optimistic-${Date.now()}`
        const optimisticMessage: ChatMessage = {
          id: optimisticId,
          user_id: user.id,
          author: currentUsername,
          avatar_url: currentAvatarUrl,
          level: currentLevel,
          content: messageContent,
          postedAt: "just now",
          channel,
          createdAt: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, optimisticMessage])
        setMessageDraft("")
        requestAnimationFrame(() => {
          jumpToLatest()
        })

        console.log("Sending message from user:", user.id)

        // Insert message into database
        const { data: insertedData, error: insertError } = await client
          .from(MESSAGES_TABLE)
          .insert([
            {
              user_id: user.id,
              content: messageContent,
              channel,
            },
          ])
          .select()

        if (insertError) {
          setMessages((prev) => prev.filter((message) => message.id !== optimisticId))
          console.error("Insert error object:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          })
          setError(`Failed to send message: ${insertError.message}`)
          return
        }

        const insertedRow = Array.isArray(insertedData) ? insertedData[0] : null
        if (insertedRow) {
          const confirmedMessage: ChatMessage = {
            id: insertedRow.id,
            user_id: insertedRow.user_id,
            author: currentUsername,
            avatar_url: currentAvatarUrl,
            level: currentLevel,
            content: insertedRow.content,
            postedAt: "just now",
            channel: insertedRow.channel,
            createdAt: insertedRow.created_at,
          }

          setMessages((prev) => {
            const withoutOptimistic = prev.filter((message) => message.id !== optimisticId)

            if (withoutOptimistic.some((message) => message.id === confirmedMessage.id)) {
              return withoutOptimistic
            }

            return [...withoutOptimistic, confirmedMessage]
          })

          if (oldestTimestampRef.current === null) {
            oldestTimestampRef.current = confirmedMessage.createdAt || null
          }
        }

        console.log("Message inserted successfully:", insertedData)
        setError(null)
      } catch (err) {
        setMessages((prev) => prev.filter((message) => !message.id.startsWith("optimistic-")))
        console.error("Unexpected error sending message:", {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          fullError: err,
        })
        setError("Failed to send message")
      } finally {
        setIsSending(false)
      }
    },
    [messageDraft, channel, currentUsername, currentAvatarUrl, currentLevel, jumpToLatest]
  )

  useEffect(() => {
    void fetchInitialMessages()
  }, [fetchInitialMessages])

  useEffect(() => {
    if (!currentUserId) {
      return
    }

    const activityEvents: Array<keyof WindowEventMap> = ["focus", "mousemove", "keydown", "click", "touchstart", "scroll"]
    const handleActiveHeartbeat = () => {
      if (document.visibilityState === "visible") {
        void updateLastSeen()
      }
    }

    const handleVisibility = () => {
      void updateLastSeen(true)
    }

    const handleBeforeUnload = () => {
      void updateLastSeen(true)
    }

    void updateLastSeen(true)
    const heartbeatId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void updateLastSeen()
      }
    }, HEARTBEAT_INTERVAL_MS)

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleActiveHeartbeat, { passive: true })
    }

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("pagehide", handleBeforeUnload)

    return () => {
      window.clearInterval(heartbeatId)
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleActiveHeartbeat)
      }
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("pagehide", handleBeforeUnload)
    }
  }, [currentUserId, updateLastSeen])

  useEffect(() => {
    void fetchStatusUsers()

    const statusRefreshId = window.setInterval(() => {
      void fetchStatusUsers()
    }, 30000)

    return () => {
      window.clearInterval(statusRefreshId)
    }
  }, [fetchStatusUsers])

  useEffect(() => {
    subscribeToMessages()
    subscribeToProfileStatus()
    subscribeToPresenceStatus()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }

      if (profileSubscriptionRef.current) {
        profileSubscriptionRef.current.unsubscribe()
      }

      if (presenceSubscriptionRef.current) {
        void presenceSubscriptionRef.current.untrack()
        presenceSubscriptionRef.current.unsubscribe()
      }
    }
  }, [subscribeToMessages, subscribeToProfileStatus, subscribeToPresenceStatus])

  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  useEffect(() => {
    if (!shouldAnchorOlderLoadRef.current) {
      return
    }

    const container = messageContainerRef.current
    if (!container) {
      shouldAnchorOlderLoadRef.current = false
      return
    }

    const newScrollHeight = container.scrollHeight
    const previousScrollHeight = previousScrollHeightRef.current
    const delta = newScrollHeight - previousScrollHeight

    if (delta > 0) {
      container.scrollTop = container.scrollTop + delta
    }

    shouldAnchorOlderLoadRef.current = false
  }, [messages])

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom()
    }
  }, [isLoading, scrollToBottom])

  const participantList = useMemo(() => {
    return [...statusUsers].sort((left, right) => {
      const leftOnline = onlineUsernames.has(left.username) || isRecentlySeen(left.lastActiveAt)
      const rightOnline = onlineUsernames.has(right.username) || isRecentlySeen(right.lastActiveAt)

      if (leftOnline !== rightOnline) {
        return leftOnline ? -1 : 1
      }

      const leftLastSeen = typeof left.lastActiveAt === "string" ? new Date(left.lastActiveAt).getTime() : 0
      const rightLastSeen = typeof right.lastActiveAt === "string" ? new Date(right.lastActiveAt).getTime() : 0

      return rightLastSeen - leftLastSeen
    })
  }, [isRecentlySeen, onlineUsernames, statusUsers])

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1c2f33] bg-[#041419]/85">
      <div className="border-b border-[#1c2f33]/90 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-[#ff620f]" size={20} />
          <h2 className="font-sans text-xl tracking-[0.08em] text-[#ff620f]">Live Chat...</h2>
        </div>
        <p className="mt-1 font-sans text-xs text-[#8d9fa3] sm:text-sm">
          Sanctum relay is live. Recent voices surface first, history rises as you scroll.
        </p>
      </div>

      <div className="border-b border-[#153038]/80 bg-[#051218]/80 px-3 py-3 sm:px-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {participantList.length === 0 ? (
            <p className="px-1 font-sans text-xs text-[#8d9fa3]">No active travelers yet.</p>
          ) : (
            participantList.map((participant) => (
              <div
                key={participant.userId}
                className="flex min-w-[176px] max-w-[216px] flex-shrink-0 items-center gap-3 rounded-lg border border-[#1a333c] bg-[#0a1d25] px-3 py-2"
              >
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-[#d4af37] bg-[#102028]">
                  {participant.avatarUrl ? (
                    <img src={participant.avatarUrl} alt={participant.username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-sans text-[11px] font-semibold text-[#d4c5a9]">
                      {getInitial(participant.username)}
                    </div>
                  )}
                  <span
                    className={`absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#071a1f] ${onlineUsernames.has(participant.username) || isRecentlySeen(participant.lastActiveAt) ? "bg-[#4dddc8] shadow-[0_0_14px_rgba(77,221,200,0.95)]" : "bg-[#6f7f86] shadow-[0_0_8px_rgba(64,76,84,0.55)]"}`}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-sans text-xs font-semibold uppercase text-[#d9783f]">{participant.username}</p>
                  <p className="truncate font-sans text-[10px] text-[#69d6df]">Level {participant.level}</p>
                  <p className="truncate text-[10px] text-[#8d9fa3]">
                    {(onlineUsernames.has(participant.username) || isRecentlySeen(participant.lastActiveAt))
                      ? "Online"
                      : `Last active ${participant.lastActiveAt ? formatTime(participant.lastActiveAt) : "unknown"}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        ref={messageContainerRef}
        onScroll={handleMessageScroll}
        className="flex-1 min-h-0 space-y-3 overflow-y-auto bg-[#071a1f] px-4 py-4 sm:px-6"
        style={{ overflowAnchor: "auto" }}
      >
        {isFetchingOlder ? (
          <div className="pb-2 text-center">
            <p className="font-sans text-xs text-[#7f979d]">Loading older messages...</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-sans text-sm text-[#8d9fa3]">Loading messages...</p>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-sans text-sm text-[#ff620f]">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-sans text-sm text-[#8d9fa3]">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.user_id === currentUserId
            const isTemporarilyHighlighted = temporarilyHighlightedIds.includes(message.id)

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <article
                  className={`flex max-w-[88%] gap-3 rounded-2xl border p-3 sm:max-w-[78%] ${
                    isOwnMessage
                      ? "border-[#47c9d4]/80 bg-[#0a2530] shadow-[0_0_0_1px_rgba(71,201,212,0.35),0_0_18px_rgba(71,201,212,0.18)]"
                      : "border-[#1a2f37] bg-[#0f1c22]"
                  } ${isTemporarilyHighlighted ? "message-feed-enter ring-1 ring-[#4bc8d6]/60" : "transition-all duration-500"}`}
                >
                  {!isOwnMessage ? (
                    <div className="relative flex-shrink-0">
                      <div className="h-9 w-9 overflow-hidden rounded-full border border-[#d4af37] bg-[#0d1f24]">
                        {message.avatar_url ? (
                          <img src={message.avatar_url} alt={message.author} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-sans text-xs font-bold text-[#d4c5a9]">
                            {getInitial(message.author)}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className={`min-w-0 flex-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                    <div className={`flex items-center gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <p className="truncate font-sans text-sm font-semibold text-[#d9783f] uppercase">{message.author}</p>
                      <p className="text-[10px] text-[#9f8f72]">LVL {message.level}</p>
                      <p className="text-[10px] text-[#6f888e]">{message.postedAt}</p>
                    </div>
                    <p className="mt-1 font-sans text-sm leading-relaxed text-[#d4dee1]">{message.content}</p>
                  </div>
                </article>
              </div>
            )
          })
        )}

        {unreadCount > 0 ? (
          <div className="sticky bottom-3 z-10 flex justify-center">
            <button
              type="button"
              onClick={jumpToLatest}
              className="rounded-full border border-[#2f6871] bg-[#0a2830]/95 px-4 py-1.5 text-xs font-semibold tracking-[0.06em] text-[#7be0e8] shadow-[0_10px_24px_-16px_rgba(0,0,0,0.9)] transition-colors hover:bg-[#103540]"
            >
              New Message {unreadCount > 1 ? `(${unreadCount})` : ""}
            </button>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <form
        className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-[#153038] bg-[#041419]/95 px-4 py-3 backdrop-blur-md sm:px-6"
        onSubmit={handleSendMessage}
      >
        <label htmlFor="chat-message" className="sr-only">
          Type message
        </label>
        <input
          id="chat-message"
          value={messageDraft}
          onChange={(event) => setMessageDraft(event.target.value)}
          placeholder="Type your message, traveler..."
          disabled={!isInitialized || isSending || !currentUserId}
          className="h-11 w-full rounded-xl border border-[#153038] bg-[#071a1f] px-3 font-sans text-sm text-[#e6edf0] placeholder:text-[#7f979d] focus:border-[#1d4f5b] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isSending || !messageDraft.trim()}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff620f] text-black transition-colors hover:bg-[#ff7b36] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#ff620f]"
          aria-label="Send message"
        >
          <SendHorizontal size={18} />
        </button>
      </form>
    </section>
  )
}
