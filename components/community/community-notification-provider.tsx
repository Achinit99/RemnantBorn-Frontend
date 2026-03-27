"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { RealtimePostgresDeletePayload, RealtimePostgresInsertPayload, SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type RealtimeRow = Record<string, unknown>

const COMMUNITY_NOTIFICATIONS_CHANNEL = "community-global-notifications"
const MAX_NOTIFICATIONS = 30

interface CommunityNotification {
  id: string
  type: "like" | "comment"
  message: string
  postId: string
  actorUserId: string
  createdAt: string
  isRead: boolean
  openComments?: boolean
}

interface CommunityNotificationContextValue {
  notifications: CommunityNotification[]
  unreadCount: number
  markAllAsRead: () => void
  markAsRead: (notificationId: string) => void
}

const CommunityNotificationContext = createContext<CommunityNotificationContextValue | undefined>(undefined)

function pickString(row: RealtimeRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return ""
}

function getNotificationStorageKey(userId: string): string {
  return `community-notifications:${userId}`
}

function createNotificationId(type: "like" | "comment", postId: string, actorUserId: string, createdAt: string): string {
  return `${type}:${postId}:${actorUserId}:${createdAt}`
}

function createNotificationIdentityKey(type: "like" | "comment", postId: string, actorUserId: string): string {
  return `${type}:${postId}::${actorUserId}`
}

function normalizeNotification(input: CommunityNotification): CommunityNotification {
  return {
    ...input,
    type: input.type ?? "like",
    openComments: input.openComments ?? false,
  }
}

function dedupeNotifications(notifications: CommunityNotification[]): CommunityNotification[] {
  const deduped: CommunityNotification[] = []
  const indexByKey = new Map<string, number>()

  for (const rawNotification of notifications) {
    const notification = normalizeNotification(rawNotification)
    const key = createNotificationIdentityKey(notification.type, notification.postId, notification.actorUserId)
    const existingIndex = indexByKey.get(key)

    if (existingIndex === undefined) {
      indexByKey.set(key, deduped.length)
      deduped.push(notification)
      continue
    }

    const existing = deduped[existingIndex]
    const existingTime = Date.parse(existing.createdAt)
    const incomingTime = Date.parse(notification.createdAt)
    const shouldReplace = Number.isFinite(incomingTime) && (!Number.isFinite(existingTime) || incomingTime > existingTime)

    if (shouldReplace) {
      deduped[existingIndex] = notification
    }
  }

  return deduped.slice(0, MAX_NOTIFICATIONS)
}

function upsertLikeNotification(
  prevNotifications: CommunityNotification[],
  nextNotification: CommunityNotification,
): { notifications: CommunityNotification[]; inserted: boolean } {
  const key = createNotificationIdentityKey(nextNotification.type, nextNotification.postId, nextNotification.actorUserId)
  const existingIndex = prevNotifications.findIndex(
    (notification) => createNotificationIdentityKey(notification.type, notification.postId, notification.actorUserId) === key,
  )

  if (existingIndex === -1) {
    return {
      notifications: [nextNotification, ...prevNotifications].slice(0, MAX_NOTIFICATIONS),
      inserted: true,
    }
  }

  const existingNotification = prevNotifications[existingIndex]
  const updatedNotification: CommunityNotification = {
    ...existingNotification,
    id: nextNotification.id,
    message: nextNotification.message,
    createdAt: nextNotification.createdAt,
    isRead: false,
    openComments: nextNotification.openComments ?? existingNotification.openComments ?? false,
  }

  const withoutExisting = prevNotifications.filter((_, index) => index !== existingIndex)
  return {
    notifications: [updatedNotification, ...withoutExisting].slice(0, MAX_NOTIFICATIONS),
    inserted: false,
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function fetchOwnerFromColumn(supabase: SupabaseClient, postId: string, column: "user_id" | "author_id" | "profile_id"): Promise<string> {
  const { data, error } = await supabase
    .from("posts")
    .select(column)
    .eq("id", postId)
    .maybeSingle()

  if (error) {
    return ""
  }

  return pickString((data as RealtimeRow | null) ?? {}, [column])
}

async function isUsersOwnedPost(supabase: SupabaseClient, postId: string, userId: string): Promise<boolean> {
  if (!postId || !userId) {
    return false
  }

  const normalizedPostId = postId.trim()

  if (!normalizedPostId) {
    return false
  }

  // Preferred path: use a DB function (RPC) that can be configured with security definer semantics.
  // Expected signature: get_post_owner(post_id uuid) -> uuid/text or a row containing owner id fields.
  const rpcResult = isUuid(normalizedPostId)
    ? await supabase.rpc("get_post_owner", { post_id: normalizedPostId })
    : { data: null, error: { message: "Skipped RPC for non-UUID post id" } }

  if (!rpcResult.error) {
    if (typeof rpcResult.data === "string") {
      return rpcResult.data === userId
    }

    if (Array.isArray(rpcResult.data)) {
      const rpcOwnerId = pickString((rpcResult.data[0] as RealtimeRow | undefined) ?? {}, [
        "owner_id",
        "user_id",
        "author_id",
        "profile_id",
      ])

      if (rpcOwnerId) {
        return rpcOwnerId === userId
      }
    }

    if (rpcResult.data && typeof rpcResult.data === "object") {
      const rpcOwnerId = pickString(rpcResult.data as RealtimeRow, ["owner_id", "user_id", "author_id", "profile_id"])

      if (rpcOwnerId) {
        return rpcOwnerId === userId
      }
    }
  }

  const ownerFromUserId = await fetchOwnerFromColumn(supabase, normalizedPostId, "user_id")

  if (ownerFromUserId) {
    return ownerFromUserId === userId
  }

  const ownerFromAuthorId = await fetchOwnerFromColumn(supabase, normalizedPostId, "author_id")

  if (ownerFromAuthorId) {
    return ownerFromAuthorId === userId
  }

  const ownerFromProfileId = await fetchOwnerFromColumn(supabase, normalizedPostId, "profile_id")

  if (ownerFromProfileId) {
    return ownerFromProfileId === userId
  }

  return false
}

async function fetchActorDisplayName(supabase: SupabaseClient, actorUserId: string): Promise<string> {
  if (!actorUserId) {
    return "Someone"
  }

  const profileResult = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", actorUserId)
    .maybeSingle()

  const profileUsername = pickString((profileResult.data as RealtimeRow | null) ?? {}, ["username"])

  if (!profileResult.error && profileUsername) {
    return profileUsername
  }

  const userResult = await supabase
    .from("users")
    .select("username")
    .eq("id", actorUserId)
    .maybeSingle()

  const userUsername = pickString((userResult.data as RealtimeRow | null) ?? {}, ["username"])

  if (!userResult.error && userUsername) {
    return userUsername
  }

  return "Someone"
}

async function resolvePostOwnerUserId(supabase: SupabaseClient, postId: string): Promise<string> {
  const normalizedPostId = postId.trim()

  if (!normalizedPostId) {
    return ""
  }

  const ownerFromUserId = await fetchOwnerFromColumn(supabase, normalizedPostId, "user_id")

  if (ownerFromUserId) {
    return ownerFromUserId
  }

  const ownerFromAuthorId = await fetchOwnerFromColumn(supabase, normalizedPostId, "author_id")

  if (ownerFromAuthorId) {
    return ownerFromAuthorId
  }

  const ownerFromProfileId = await fetchOwnerFromColumn(supabase, normalizedPostId, "profile_id")

  return ownerFromProfileId
}

export function CommunityNotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([])
  const currentUserIdRef = useRef("")
  const ownerByPostIdRef = useRef<Record<string, string>>({})
  const unresolvedPostIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      return
    }

    let isActive = true

    const loadCurrentUserAndNotifications = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("[CommunityNotificationProvider] Failed to fetch auth session:", error)
      }

      const userId = data.session?.user?.id ?? ""

      if (!isActive) {
        return
      }

      currentUserIdRef.current = userId

      if (!userId) {
        setNotifications([])
        return
      }

      const rawStored = window.localStorage.getItem(getNotificationStorageKey(userId))

      if (!rawStored) {
        setNotifications([])
        return
      }

      try {
        const parsed = JSON.parse(rawStored) as CommunityNotification[]

        if (Array.isArray(parsed)) {
          setNotifications(dedupeNotifications(parsed))
        }
      } catch {
        setNotifications([])
      }
    }

    void loadCurrentUserAndNotifications()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? ""
      currentUserIdRef.current = userId

      if (!userId) {
        setNotifications([])
        return
      }

      const rawStored = window.localStorage.getItem(getNotificationStorageKey(userId))

      if (!rawStored) {
        setNotifications([])
        return
      }

      try {
        const parsed = JSON.parse(rawStored) as CommunityNotification[]

        if (Array.isArray(parsed)) {
          setNotifications(dedupeNotifications(parsed))
        } else {
          setNotifications([])
        }
      } catch {
        setNotifications([])
      }
    })

    const channel = supabase
      .channel(COMMUNITY_NOTIFICATIONS_CHANNEL)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_likes",
        },
        async (payload: RealtimePostgresInsertPayload<RealtimeRow>) => {
          if (!isActive) {
            return
          }

          const currentUserId = currentUserIdRef.current
          const likedPostId = pickString(payload.new, ["post_id"])
          const likedByUserId = pickString(payload.new, ["user_id"])

          if (!currentUserId || !likedPostId) {
            return
          }

          if (likedByUserId && likedByUserId === currentUserId) {
            return
          }

          if (unresolvedPostIdsRef.current.has(likedPostId)) {
            return
          }

          const cachedOwner = ownerByPostIdRef.current[likedPostId]
          let shouldNotify = cachedOwner ? cachedOwner === currentUserId : false

          if (!cachedOwner) {
            shouldNotify = await isUsersOwnedPost(supabase, likedPostId, currentUserId)

            if (shouldNotify) {
              ownerByPostIdRef.current[likedPostId] = currentUserId
            } else {
              unresolvedPostIdsRef.current.add(likedPostId)
            }
          }

          if (!shouldNotify) {
            return
          }

          const createdAt = pickString(payload.new, ["created_at", "inserted_at"]) || new Date().toISOString()
          const notificationId = createNotificationId("like", likedPostId, likedByUserId, createdAt)
          const nextNotification: CommunityNotification = {
            id: notificationId,
            type: "like",
            message: "Someone liked your achievement! 🎉",
            postId: likedPostId,
            actorUserId: likedByUserId,
            createdAt,
            isRead: false,
            openComments: false,
          }
          let didInsert = false

          setNotifications((prevNotifications) => {
            const upsertResult = upsertLikeNotification(prevNotifications, nextNotification)
            didInsert = upsertResult.inserted
            return upsertResult.notifications
          })

          if (didInsert) {
            toast.success("Someone liked your achievement! 🎉")
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        async (payload: RealtimePostgresInsertPayload<RealtimeRow>) => {
          if (!isActive) {
            return
          }

          const currentUserId = currentUserIdRef.current
          const commentedPostId = pickString(payload.new, ["post_id"])
          const actorUserId = pickString(payload.new, ["user_id"])

          if (!currentUserId || !commentedPostId || !actorUserId) {
            return
          }

          if (actorUserId === currentUserId) {
            return
          }

          const cachedOwner = ownerByPostIdRef.current[commentedPostId]
          let postOwnerUserId = cachedOwner

          if (!postOwnerUserId) {
            postOwnerUserId = await resolvePostOwnerUserId(supabase, commentedPostId)

            if (postOwnerUserId) {
              ownerByPostIdRef.current[commentedPostId] = postOwnerUserId
            }
          }

          const shouldNotify = !!postOwnerUserId && postOwnerUserId === currentUserId

          if (!shouldNotify) {
            return
          }

          const actorNameFromPayload = pickString(payload.new, ["username", "author", "display_name"]) || "Someone"
          const createdAt = pickString(payload.new, ["created_at", "inserted_at"]) || new Date().toISOString()
          const notificationId = createNotificationId("comment", commentedPostId, actorUserId, createdAt)
          const nextNotification: CommunityNotification = {
            id: notificationId,
            type: "comment",
            message: `${actorNameFromPayload} commented on your post`,
            postId: commentedPostId,
            actorUserId,
            createdAt,
            isRead: false,
            openComments: true,
          }
          let didInsert = false

          setNotifications((prevNotifications) => {
            const upsertResult = upsertLikeNotification(prevNotifications, nextNotification)
            didInsert = upsertResult.inserted
            return upsertResult.notifications
          })

          if (didInsert) {
            toast.success(`${actorNameFromPayload} commented on your post`)
          }

          if (actorNameFromPayload === "Someone") {
            const actorName = await fetchActorDisplayName(supabase, actorUserId)

            if (actorName && actorName !== "Someone") {
              setNotifications((prevNotifications) => {
                const upsertResult = upsertLikeNotification(prevNotifications, {
                  ...nextNotification,
                  message: `${actorName} commented on your post`,
                })

                return upsertResult.notifications
              })
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "post_likes",
        },
        async (payload: RealtimePostgresDeletePayload<RealtimeRow>) => {
          if (!isActive) {
            return
          }

          const unLikedPostId = pickString(payload.old, ["post_id"])
          const unLikedByUserId = pickString(payload.old, ["user_id"])

          if (!unLikedPostId || !unLikedByUserId) {
            return
          }

          setNotifications((prevNotifications) => {
            const filtered = prevNotifications.filter(
              (notification) =>
                !(
                  notification.type === "like" &&
                  notification.postId === unLikedPostId &&
                  notification.actorUserId === unLikedByUserId
                ),
            )

            return filtered
          })
        },
      )
      .subscribe()

    return () => {
      isActive = false
      authSubscription.subscription.unsubscribe()
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const currentUserId = currentUserIdRef.current

    if (!currentUserId) {
      return
    }

    window.localStorage.setItem(getNotificationStorageKey(currentUserId), JSON.stringify(notifications))
  }, [notifications])

  const contextValue = useMemo<CommunityNotificationContextValue>(() => {
    const unreadCount = notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0)

    return {
      notifications,
      unreadCount,
      markAllAsRead: () => {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
        )
      },
      markAsRead: (notificationId: string) => {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification,
          ),
        )
      },
    }
  }, [notifications])

  return <CommunityNotificationContext.Provider value={contextValue}>{children}</CommunityNotificationContext.Provider>
}

export function useCommunityNotifications(): CommunityNotificationContextValue {
  const context = useContext(CommunityNotificationContext)

  if (!context) {
    throw new Error("useCommunityNotifications must be used within CommunityNotificationProvider")
  }

  return context
}
