/**
 * What: Compact global live chat preview panel for the dashboard.
 * Why: Keeps dashboard synced with realtime chat while staying lightweight.
 */
"use client"

import { MessageCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"

import type { ChatMessage } from "@/components/community/types"
import {
  GLOBAL_CHANNEL_FILTER,
  GLOBAL_CHAT_PAGE_SIZE,
  GLOBAL_CHAT_SYNC_CHANNEL,
  GLOBAL_TEXT_CHANNEL,
  MESSAGES_SELECT_WITH_PROFILE,
  MESSAGES_TABLE,
} from "@/components/community/chat-realtime-config"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

const PREVIEW_FALLBACK_LEVEL = 1

type PreviewMessageRow = {
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

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return "just now"
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return "just now"
  }
}

function getInitial(username: string): string {
  const trimmed = username.trim()
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "?"
}

function mapMessageRow(row: PreviewMessageRow): ChatMessage {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles

  return {
    id: row.id,
    user_id: row.user_id,
    author: profile?.username || "Unknown",
    avatar_url: profile?.avatar_url || null,
    level: profile?.level ?? PREVIEW_FALLBACK_LEVEL,
    content: row.content,
    postedAt: formatTime(row.created_at),
    channel: row.channel,
    createdAt: row.created_at,
  }
}

export function LiveChatPreview() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingOlder, setIsFetchingOlder] = useState(false)
  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [recentlyHighlightedIds, setRecentlyHighlightedIds] = useState<string[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const oldestTimestampRef = useRef<string | null>(null)
  const shouldAnchorOlderLoadRef = useRef(false)
  const previousScrollHeightRef = useRef(0)
  const subscriptionRef = useRef<any>(null)

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    container.scrollTop = container.scrollHeight
  }, [])

  const fetchPreviewMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      const client = getSupabaseBrowserClient()

      if (!client) {
        setError("Supabase client not initialized")
        return
      }

      const { data, error: fetchError } = await client
        .from(MESSAGES_TABLE)
        .select(MESSAGES_SELECT_WITH_PROFILE)
        .eq("channel", GLOBAL_TEXT_CHANNEL)
        .order("created_at", { ascending: false })
        .limit(GLOBAL_CHAT_PAGE_SIZE)

      if (fetchError) {
        throw fetchError
      }

      const mappedMessages = (data || []).map((row) => mapMessageRow(row as PreviewMessageRow)).reverse()

      oldestTimestampRef.current = mappedMessages[0]?.createdAt ?? null
      setHasMoreOlder((data || []).length === GLOBAL_CHAT_PAGE_SIZE)
      setMessages(mappedMessages)
      setError(null)

      requestAnimationFrame(() => {
        scrollToBottom()
      })
    } catch (err) {
      console.error("Error fetching chat preview:", err)
      setError("Failed to load live chat preview")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchOlderMessages = useCallback(async () => {
    if (isFetchingOlder || !hasMoreOlder || !oldestTimestampRef.current) {
      return
    }

    try {
      const client = getSupabaseBrowserClient()

      if (!client) {
        return
      }

      const container = scrollContainerRef.current

      if (container) {
        previousScrollHeightRef.current = container.scrollHeight
        shouldAnchorOlderLoadRef.current = true
      }

      setIsFetchingOlder(true)

      const { data, error: fetchError } = await client
        .from(MESSAGES_TABLE)
        .select(MESSAGES_SELECT_WITH_PROFILE)
        .eq("channel", GLOBAL_TEXT_CHANNEL)
        .lt("created_at", oldestTimestampRef.current)
        .order("created_at", { ascending: false })
        .limit(GLOBAL_CHAT_PAGE_SIZE)

      if (fetchError) {
        throw fetchError
      }

      const olderMessages = (data || []).map((row) => mapMessageRow(row as PreviewMessageRow)).reverse()

      if (olderMessages.length === 0) {
        setHasMoreOlder(false)
        return
      }

      oldestTimestampRef.current = olderMessages[0]?.createdAt ?? oldestTimestampRef.current
      setHasMoreOlder((data || []).length === GLOBAL_CHAT_PAGE_SIZE)

      setMessages((prev) => {
        const existingIds = new Set(prev.map((message) => message.id))
        const uniqueOlderMessages = olderMessages.filter((message) => !existingIds.has(message.id))

        if (uniqueOlderMessages.length === 0) {
          return prev
        }

        return [...uniqueOlderMessages, ...prev]
      })
    } catch (err) {
      console.error("Error fetching older chat preview messages:", err)
    } finally {
      setIsFetchingOlder(false)
    }
  }, [hasMoreOlder, isFetchingOlder])

  const handleMessageScroll = useCallback(() => {
    const container = scrollContainerRef.current

    if (!container || isFetchingOlder || !hasMoreOlder) {
      return
    }

    if (container.scrollTop <= 24) {
      void fetchOlderMessages()
    }
  }, [fetchOlderMessages, hasMoreOlder, isFetchingOlder])

  const subscribeToGlobalChat = useCallback(() => {
    const client = getSupabaseBrowserClient()
    if (!client) {
      return
    }

    subscriptionRef.current = client
      .channel(GLOBAL_CHAT_SYNC_CHANNEL)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: MESSAGES_TABLE,
          filter: GLOBAL_CHANNEL_FILTER,
        },
        async (payload) => {
          try {
            const insertedRow = payload.new as PreviewMessageRow
            const { data: profile } = await client
              .from("profiles")
              .select("username, avatar_url, level")
              .eq("user_id", insertedRow.user_id)
              .maybeSingle()

            const mappedMessage: ChatMessage = {
              id: insertedRow.id,
              user_id: insertedRow.user_id,
              author: profile?.username || "Unknown",
              avatar_url: profile?.avatar_url || null,
              level: profile?.level ?? PREVIEW_FALLBACK_LEVEL,
              content: insertedRow.content,
              postedAt: "just now",
              channel: insertedRow.channel,
              createdAt: insertedRow.created_at,
            }

            setMessages((prev) => {
              if (prev.some((message) => message.id === mappedMessage.id)) {
                return prev
              }

              return [...prev, mappedMessage]
            })

            setRecentlyHighlightedIds((currentIds) => {
              if (currentIds.includes(mappedMessage.id)) {
                return currentIds
              }

              return [...currentIds, mappedMessage.id]
            })

            window.setTimeout(() => {
              setRecentlyHighlightedIds((currentIds) =>
                currentIds.filter((messageId) => messageId !== mappedMessage.id)
              )
            }, 2000)

            requestAnimationFrame(() => {
              scrollToBottom()
            })
          } catch (err) {
            console.error("Error handling chat preview insert:", err)
          }
        }
      )
      .subscribe()
  }, [scrollToBottom])

  useEffect(() => {
    const initializeAuth = async () => {
      const client = getSupabaseBrowserClient()
      if (!client) {
        return
      }

      const { data } = await client.auth.getUser()
      setCurrentUserId(data.user?.id ?? null)
    }

    void initializeAuth()
  }, [])

  useEffect(() => {
    void fetchPreviewMessages()
  }, [fetchPreviewMessages])

  useEffect(() => {
    subscribeToGlobalChat()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [subscribeToGlobalChat])

  useEffect(() => {
    if (!shouldAnchorOlderLoadRef.current) {
      return
    }

    const container = scrollContainerRef.current

    if (!container) {
      shouldAnchorOlderLoadRef.current = false
      return
    }

    const nextScrollHeight = container.scrollHeight
    container.scrollTop = nextScrollHeight - previousScrollHeightRef.current
    shouldAnchorOlderLoadRef.current = false
  }, [messages])

  return (
    <section className="glass-card-3d rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle className="text-[#ff620f]" size={16} />
        <h3 className="glass-title-gold font-sans text-sm tracking-[0.08em] uppercase">Global Feed</h3>
      </div>

      <div className="flex h-[320px] flex-col rounded-xl border border-[#153038] bg-[#071a1f]/80">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3"
          style={{ overflowAnchor: "auto" }}
          onScroll={handleMessageScroll}
        >
        {isLoading ? (
          <p className="py-4 text-center font-sans text-xs text-[#8d9fa3]">Loading messages...</p>
        ) : error ? (
          <p className="py-4 text-center font-sans text-xs text-[#ff620f]">{error}</p>
        ) : isFetchingOlder ? (
          <p className="py-1 text-center font-sans text-[11px] text-[#8d9fa3]">Loading older messages...</p>
        ) : messages.length === 0 ? (
          <p className="py-4 text-center font-sans text-xs text-[#8d9fa3]">No global messages yet.</p>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.user_id === currentUserId
            const isHighlighted = recentlyHighlightedIds.includes(message.id)

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <article
                  className={`flex max-w-[88%] gap-3 rounded-2xl border p-3 sm:max-w-[80%] ${
                    isOwnMessage
                      ? "border-[#47c9d4]/80 bg-[#0a2530] shadow-[0_0_0_1px_rgba(71,201,212,0.35),0_0_18px_rgba(71,201,212,0.18)]"
                      : "border-[#1a2f37] bg-[#0f1c22]"
                  } ${isHighlighted ? "message-feed-enter ring-1 ring-[#4bc8d6]/60" : "transition-all duration-300"}`}
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
                    <p className="glass-body-offwhite mt-1 font-sans text-sm leading-relaxed">{message.content}</p>
                  </div>
                </article>
              </div>
            )
          })
        )}
        </div>
      </div>
    </section>
  )
}
