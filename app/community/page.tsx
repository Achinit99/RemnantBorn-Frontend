/**
 * What: Community dashboard page that blends profile, bounties, social preview, and chat.
 * Why: Acts as the main hub and coordinates auth-aware realtime social interactions.
 */
"use client"

import axios from "axios"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useRouter } from "next/navigation"
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  SupabaseClient,
} from "@supabase/supabase-js"

import {
  dailyRelic,
  bounties,
} from "@/app/community/mock-data"
import { AchievementFeed } from "@/components/community/achievement-feed"
import { BountyBoard } from "@/components/community/bounty-board"
import { DailyRelicStatus } from "@/components/community/daily-relic-status"
import { LiveChatPreview } from "@/components/community/live-chat-preview"
import type { AchievementPost, PlayerProfile } from "@/components/community/types"
import { PlayerProfileSidebar } from "@/components/community/player-profile-sidebar"
import { getApiErrorMessage } from "@/lib/auth-api"
import { clearClientAuthSession, getStoredAccessToken } from "@/lib/auth"
import { getUserProfile, mapProfileResponseToPlayerProfile } from "@/lib/profile.service"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type RealtimePostRow = Record<string, unknown>
type RealtimeLikeRow = Record<string, unknown>
type RealtimeCommentRow = Record<string, unknown>

const COMMUNITY_SOCIAL_SYNC_CHANNEL = "community-social-sync"

function pickString(row: RealtimePostRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return ""
}

function pickNumber(row: RealtimePostRow, keys: string[]): number {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return 0
}

function formatPostedAt(createdAt: string): string {
  if (!createdAt) {
    return "Just now"
  }

  const createdAtDate = new Date(createdAt)

  if (Number.isNaN(createdAtDate.getTime())) {
    return "Just now"
  }

  const elapsedMs = Date.now() - createdAtDate.getTime()
  const elapsedMinutes = Math.floor(elapsedMs / 60000)

  if (elapsedMinutes <= 0) {
    return "Just now"
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60)

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`
  }

  const elapsedDays = Math.floor(elapsedHours / 24)
  return `${elapsedDays}d ago`
}

function extractUserIdFromAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    return ""
  }

  const tokenParts = accessToken.split(".")

  if (tokenParts.length < 2) {
    return ""
  }

  try {
    const normalizedPayload = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = JSON.parse(atob(normalizedPayload)) as { sub?: unknown }
    return typeof jsonPayload.sub === "string" ? jsonPayload.sub : ""
  } catch {
    return ""
  }
}

function incrementPostLike(posts: AchievementPost[], postId: string, amount: number): AchievementPost[] {
  return posts.map((post) => {
    if (post.id !== postId) {
      return post
    }

    return {
      ...post,
      likes: Math.max(0, post.likes + amount),
    }
  })
}

function incrementPostComment(posts: AchievementPost[], postId: string, amount: number): AchievementPost[] {
  return posts.map((post) => {
    if (post.id !== postId) {
      return post
    }

    return {
      ...post,
      comments: Math.max(0, post.comments + amount),
    }
  })
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code
  }

  return ""
}

async function fetchLikedPostIdsForUser(supabase: SupabaseClient, userId: string, postIds: string[]): Promise<Set<string>> {
  if (!userId || postIds.length === 0) {
    return new Set<string>()
  }

  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds)

  if (error) {
    throw error
  }

  const likedPostIds = new Set<string>()

  for (const row of data ?? []) {
    const postId = pickString(row as RealtimeLikeRow, ["post_id"])

    if (postId) {
      likedPostIds.add(postId)
    }
  }

  return likedPostIds
}

function mergePosts(primaryPosts: AchievementPost[], secondaryPosts: AchievementPost[]): AchievementPost[] {
  const mergedPosts = [...primaryPosts, ...secondaryPosts]
  const seenPostIds = new Set<string>()

  return mergedPosts.filter((post) => {
    if (seenPostIds.has(post.id)) {
      return false
    }

    seenPostIds.add(post.id)
    return true
  })
}

async function fetchAuthorDetailsIfNeeded(supabase: SupabaseClient, row: RealtimePostRow): Promise<{ author: string; avatarUrl: string }> {
  const author = pickString(row, ["username", "author", "author_username", "display_name"])
  const avatarUrl = pickString(row, ["avatar_url", "avatarUrl", "author_avatar_url", "avatar"])

  if (author && avatarUrl) {
    return { author, avatarUrl }
  }

  const authorId = pickString(row, ["author_id", "user_id", "profile_id"])

  if (!authorId) {
    return {
      author: author || "Unknown Player",
      avatarUrl,
    }
  }

  const profileResult = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("user_id", authorId)
    .maybeSingle()

  if (!profileResult.error && profileResult.data) {
    return {
      author: profileResult.data.username || author || "Unknown Player",
      avatarUrl: profileResult.data.avatar_url || avatarUrl || "",
    }
  }

  const userResult = await supabase
    .from("users")
    .select("username, avatar_url")
    .eq("id", authorId)
    .maybeSingle()

  if (!userResult.error && userResult.data) {
    return {
      author: userResult.data.username || author || "Unknown Player",
      avatarUrl: userResult.data.avatar_url || avatarUrl || "",
    }
  }

  return {
    author: author || "Unknown Player",
    avatarUrl,
  }
}

async function mapRealtimePostToAchievementPost(supabase: SupabaseClient, row: RealtimePostRow): Promise<AchievementPost> {
  const authorDetails = await fetchAuthorDetailsIfNeeded(supabase, row)
  const createdAt = pickString(row, ["created_at"])
  const postId = pickString(row, ["id"]) || `rt-${Date.now()}`

  return {
    id: postId,
    author: authorDetails.author,
    avatarUrl: authorDetails.avatarUrl,
    postedAt: formatPostedAt(createdAt),
    content: pickString(row, ["content", "body", "text"]),
    likes: pickNumber(row, ["likes", "like_count", "likes_count"]),
    comments: pickNumber(row, ["comments", "comment_count", "comments_count"]),
    shares: pickNumber(row, ["shares", "share_count", "shares_count"]),
  }
}

function DashboardSidebarSkeleton() {
  return (
    <aside className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.85)] sm:p-6">
      <div className="h-6 w-32 animate-pulse rounded-md bg-[#0d2328]" />
      <div className="mt-6 flex flex-col items-center">
        <div className="h-24 w-24 animate-pulse rounded-full border-2 border-[#1c2f33] bg-[#0d2328]" />
        <div className="mt-4 h-8 w-40 animate-pulse rounded-lg bg-[#0d2328]" />
        <div className="mt-2 h-4 w-44 animate-pulse rounded-lg bg-[#0b1d21]" />
        <div className="mt-2 h-4 w-20 animate-pulse rounded-lg bg-[#0b1d21]" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded-lg bg-[#0b1d21]" />
      </div>
      <div className="mt-6 h-24 animate-pulse rounded-xl border border-[#122328] bg-[#06181d]" />
      <div className="mt-6 h-28 animate-pulse rounded-xl border border-[#122328] bg-[#06181d]" />
      <div className="mt-6 h-12 animate-pulse rounded-xl bg-[#0d2328]" />
    </aside>
  )
}

export default function CommunityDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [profileErrorMessage, setProfileErrorMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState("")
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [previewPosts, setPreviewPosts] = useState<AchievementPost[]>([])
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [pendingLikePostIds, setPendingLikePostIds] = useState<Set<string>>(new Set())
  const supabaseAuthUserIdRef = useRef("")
  const didShowMissingSessionAlertRef = useRef(false)
  const likedPostIdsRef = useRef<Set<string>>(new Set())
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set())

  // Keeping refs fresh so rapid clicking still uses the latest state.
  useEffect(() => {
    likedPostIdsRef.current = likedPostIds
  }, [likedPostIds])

  // Pending set ref helps us block duplicate like/unlike requests.
  useEffect(() => {
    pendingLikePostIdsRef.current = pendingLikePostIds
  }, [pendingLikePostIds])

  const previewBounties = bounties.slice(0, 3)

  // === Like/Unlike Logic Starts Here ===
  const handleLike = async (postId: string) => {
    if (!postId || pendingLikePostIdsRef.current.has(postId)) {
      return
    }

    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      return
    }

    const sessionResult = await supabase.auth.getSession()

    const sessionUserId = sessionResult.data.session?.user?.id ?? ""
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = sessionUserId || user?.id || supabaseAuthUserIdRef.current || currentUserId

    if (!userId) {
      if (!didShowMissingSessionAlertRef.current) {
        didShowMissingSessionAlertRef.current = true
        window.alert("Please log in to like posts")
      }
      return
    }

    const isAlreadyLiked = likedPostIdsRef.current.has(postId)
    const shouldLike = !isAlreadyLiked
    const optimisticDelta = shouldLike ? 1 : isAlreadyLiked ? -1 : 0

    // === Ownership Guard ===
    // No owned like, no decrement. This stops accidental count drops.
    if (!shouldLike && !isAlreadyLiked) {
      return
    }

    if (shouldLike) {
      setPreviewPosts((prevPosts) => incrementPostLike(prevPosts, postId, optimisticDelta))
      setLikedPostIds((prev) => {
        const next = new Set(prev)
        next.add(postId)
        likedPostIdsRef.current = next
        return next
      })
    } else {
      // Force immediate local unlike paint before network call to avoid heart-color lag.
      // Use functional update pattern with fresh Set instance to trigger immediate re-render.
      flushSync(() => {
        setLikedPostIds((prev) => {
          const next = new Set(prev)
          next.delete(postId)
          likedPostIdsRef.current = next
          return next
        })
        setPreviewPosts((prevPosts) => incrementPostLike(prevPosts, postId, optimisticDelta))
      })
    }
    setPendingLikePostIds((prevPendingLikePostIds) => {
      const nextPendingLikePostIds = new Set(prevPendingLikePostIds)
      nextPendingLikePostIds.add(postId)
      pendingLikePostIdsRef.current = nextPendingLikePostIds
      return nextPendingLikePostIds
    })

    try {
      const mutationResult = shouldLike
        ? await supabase.from("post_likes").insert({
            post_id: postId,
            user_id: userId,
          })
        : await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)

      const { error } = mutationResult

      if (error) {
        throw error
      }

      // Unlike successful. Realtime DELETE listener will handle count decrement optimistically.
      // No need to fetch confirmed count as it would hit RLS and cause noise.
    } catch (error) {
      if (shouldLike && getErrorCode(error) === "23505") {
        // Already liked by this user. Roll back optimistic count, but keep liked state.
        setPreviewPosts((prevPosts) => incrementPostLike(prevPosts, postId, -1))
        setLikedPostIds((prev) => {
          const next = new Set(prev)
          next.add(postId)
          likedPostIdsRef.current = next
          return next
        })
        return
      }

      setPreviewPosts((prevPosts) => incrementPostLike(prevPosts, postId, -optimisticDelta))
      setLikedPostIds((prevLikedPostIds) => {
        const nextLikedPostIds = new Set(prevLikedPostIds)

        if (isAlreadyLiked) {
          nextLikedPostIds.add(postId)
        } else {
          nextLikedPostIds.delete(postId)
        }

        likedPostIdsRef.current = nextLikedPostIds
        return nextLikedPostIds
      })

      const normalizedError = error as { message?: string; code?: string } | null
      console.error("[CommunityDashboardPage] Error toggling like:", normalizedError?.message || error)

      if (!shouldLike) {
        const deleteVerification = await supabase
          .from("post_likes")
          .select("post_id, user_id")
          .eq("post_id", postId)
          .eq("user_id", userId)
          .maybeSingle()

        if (deleteVerification.error) {
          console.error(
            "[CommunityDashboardPage] Delete verification failed (possible RLS/permission issue):",
            deleteVerification.error.message || deleteVerification.error,
          )
        }
      }
    } finally {
      setPendingLikePostIds((prevPendingLikePostIds) => {
        const nextPendingLikePostIds = new Set(prevPendingLikePostIds)
        nextPendingLikePostIds.delete(postId)
        pendingLikePostIdsRef.current = nextPendingLikePostIds
        return nextPendingLikePostIds
      })
    }
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      setIsAuthLoading(false)
      return
    }

    let isActive = true
    const authLoadingTimeout = window.setTimeout(() => {
      if (isActive) {
        setIsAuthLoading(false)
      }
    }, 2000)

    const syncAuthUser = async () => {
      try {
        setIsAuthLoading(true)

        const accessToken = getStoredAccessToken()
        const decodedTokenUserId = extractUserIdFromAccessToken(accessToken)

        const getUserResult = await supabase.auth.getUser()
        let resolvedUserId = getUserResult.data.user?.id ?? ""

        if ((getUserResult.error || !resolvedUserId) && isActive) {
          const sessionResult = await supabase.auth.getSession()

          if (sessionResult.error) {
            console.error(
              "[CommunityDashboardPage] Failed to resolve auth session:",
              sessionResult.error.message || sessionResult.error,
            )
          }

          resolvedUserId = sessionResult.data.session?.user?.id ?? ""
        }

        if (decodedTokenUserId && resolvedUserId && decodedTokenUserId !== resolvedUserId) {
          console.warn("[CommunityDashboardPage] User ID mismatch detected", {
            decodedTokenUserId,
            supabaseAuthUserId: resolvedUserId,
          })
        }

        if (!isActive) {
          return
        }

        supabaseAuthUserIdRef.current = resolvedUserId
        setCurrentUserId(resolvedUserId)
        setIsAuthLoading(false)

        if (resolvedUserId) {
          didShowMissingSessionAlertRef.current = false
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        setIsAuthLoading(false)
        console.error("[CommunityDashboardPage] Auth sync failed:", error)
      }
    }

    void syncAuthUser()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return
      }

      const authUserId = session?.user?.id ?? ""
      supabaseAuthUserIdRef.current = authUserId
      setCurrentUserId(authUserId)
      setIsAuthLoading(false)

      if (authUserId) {
        didShowMissingSessionAlertRef.current = false
      }
    })

    return () => {
      isActive = false
      window.clearTimeout(authLoadingTimeout)
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      router.replace("/login")

      return () => {
        isMounted = false
      }
    }

    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile()

        if (!isMounted) {
          return
        }

        setProfile(mapProfileResponseToPlayerProfile(userProfile))
        setProfileErrorMessage("")
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === "Missing access token") {
          clearClientAuthSession()
          router.replace("/login")
          return
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearClientAuthSession()
          router.replace("/login")
          return
        }

        setProfileErrorMessage(getApiErrorMessage(error, "Unable to load your player profile right now."))
      } finally {
        if (isMounted) {
          setIsProfileLoading(false)
        }
      }
    }

    void fetchProfile()

    return () => {
      isMounted = false
    }
  }, [router])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      return
    }

    let isMounted = true

    const loadLatestPosts = async () => {
      try {
        const sessionResult = await supabase.auth.getSession()

        const sessionUserId = sessionResult.data.session?.user?.id ?? ""

        if (isMounted && sessionUserId) {
          supabaseAuthUserIdRef.current = sessionUserId
          setCurrentUserId(sessionUserId)
        }

        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3)

        if (error) {
          throw error
        }

        const mappedPosts = await Promise.all(
          (data ?? []).map((postRow) => mapRealtimePostToAchievementPost(supabase, postRow as RealtimePostRow)),
        )

        if (!isMounted) {
          return
        }

        // Supabase trigger keeps this column up to date; use posts.likes as initial truth.
        setPreviewPosts(mappedPosts)
      } catch (error) {
        console.error("[CommunityDashboardPage] Error loading preview posts:", error)
      }
    }

    void loadLatestPosts()

    // === Realtime Events Handled Here ===
    // Reconcile count from DB on each event to avoid double add/subtract issues.
    const channel = supabase
      .channel(COMMUNITY_SOCIAL_SYNC_CHANNEL)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload: RealtimePostgresInsertPayload<RealtimePostRow>) => {
          if (!isMounted) {
            return
          }

          try {
            const mappedPost = await mapRealtimePostToAchievementPost(supabase, payload.new)

            if (!isMounted) {
              return
            }

            setPreviewPosts((prevPosts) => mergePosts([mappedPost], prevPosts).slice(0, 3))
          } catch (error) {
            console.error("[CommunityDashboardPage] Error processing preview realtime payload:", error)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
        },
        (payload: RealtimePostgresUpdatePayload<RealtimePostRow>) => {
          if (!isMounted) {
            return
          }

          const updatedPostId = pickString(payload.new, ["id"])

          if (!updatedPostId) {
            return
          }

          const authoritativeLikeCount = pickNumber(payload.new, ["likes", "like_count", "likes_count"])
          const authoritativeCommentCount = pickNumber(payload.new, ["comments", "comment_count", "comments_count"])

          // DB trigger-backed posts columns are canonical; reconcile optimistic local counts to them.
          setPreviewPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === updatedPostId
                ? {
                    ...post,
                    likes: authoritativeLikeCount,
                    comments: authoritativeCommentCount,
                  }
                : post,
            ),
          )
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        (payload: RealtimePostgresInsertPayload<RealtimeCommentRow>) => {
          if (!isMounted) {
            return
          }

          const commentedPostId = pickString(payload.new, ["post_id"])

          if (!commentedPostId) {
            return
          }

          // Optimistic live bump for all viewers; posts UPDATE event reconciles authoritative count.
          setPreviewPosts((prevPosts) => incrementPostComment(prevPosts, commentedPostId, 1))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
        },
        (payload: RealtimePostgresDeletePayload<RealtimeCommentRow>) => {
          if (!isMounted) {
            return
          }

          const commentedPostId = pickString(payload.old, ["post_id"])

          if (!commentedPostId) {
            return
          }

          // Optimistic live decrement for all viewers; posts UPDATE event reconciles authoritative count.
          setPreviewPosts((prevPosts) => incrementPostComment(prevPosts, commentedPostId, -1))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_likes",
        },
        async (payload: RealtimePostgresInsertPayload<RealtimeLikeRow>) => {
          if (!isMounted) {
            return
          }

          const likedPostId = pickString(payload.new, ["post_id"])
          const likedByUserId = pickString(payload.new, ["user_id"])

          if (!likedPostId) {
            return
          }

          const authUserId = supabaseAuthUserIdRef.current
          const isSelfLike = !!likedByUserId && !!authUserId && likedByUserId === authUserId

          if (isSelfLike) {
            // Force immediate re-render of like state for self-events via flushSync
            flushSync(() => {
              setLikedPostIds((prev) => {
                const next = new Set(prev)
                next.add(likedPostId)
                likedPostIdsRef.current = next
                return next
              })
            })
          }

          // Optimistic update for snappy UI; posts.likes remains source of truth via trigger-backed updates.
          if (!isMounted) {
            return
          }

          setPreviewPosts((prevPosts) => incrementPostLike(prevPosts, likedPostId, 1))
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "post_likes",
        },
        async (payload: RealtimePostgresDeletePayload<RealtimeLikeRow>) => {
          if (!isMounted) {
            return
          }

          const likedPostId = pickString(payload.old, ["post_id"])
          const unlikedByUserId = pickString(payload.old, ["user_id"])

          if (!likedPostId) {
            return
          }

          if (unlikedByUserId && supabaseAuthUserIdRef.current && unlikedByUserId === supabaseAuthUserIdRef.current) {
            // Force immediate re-render of unlike state for self-events via flushSync
            flushSync(() => {
              setLikedPostIds((prev) => {
                const next = new Set(prev)
                next.delete(likedPostId)
                likedPostIdsRef.current = next
                return next
              })
            })
          }

          // Optimistic update for snappy UI; posts.likes remains source of truth via trigger-backed updates.
          if (!isMounted) {
            return
          }

          setPreviewPosts((prevPosts) => incrementPostLike(prevPosts, likedPostId, -1))
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase || isAuthLoading || !currentUserId || previewPosts.length === 0) {
      return
    }

    let isActive = true

    // Refreshing this set keeps heart color logic clean and predictable.
    const syncLikedPostIds = async () => {
      try {
        const postIds = previewPosts.map((post) => post.id)
        const likedPostIdsForUser = await fetchLikedPostIdsForUser(supabase, currentUserId, postIds)

        if (isActive) {
          setLikedPostIds(likedPostIdsForUser)
          likedPostIdsRef.current = likedPostIdsForUser
        }
      } catch (error) {
        console.error("[CommunityDashboardPage] Error syncing liked posts for auth user:", error)
      }
    }

    void syncLikedPostIds()

    return () => {
      isActive = false
    }
  }, [currentUserId, isAuthLoading, previewPosts])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Community Dashboard</h1>
            <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">
              Summary view with latest updates across bounties, social feed, and live chat.
            </p>
          </div>
          <p className="font-sans text-xs tracking-[0.1em] text-[#8d9fa3] uppercase">Home Summary</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xs tracking-[0.1em] text-[#8d9fa3] uppercase">Player</h2>
            <Link href="/community/profile" className="font-sans text-sm text-[#8d9fa3] transition-colors hover:text-[#FF6B00]">
              Open Profile
            </Link>
          </div>
          {isProfileLoading ? <DashboardSidebarSkeleton /> : profile ? <PlayerProfileSidebar profile={profile} /> : null}
          {profileErrorMessage && !isProfileLoading && !profile ? (
            <div className="rounded-2xl border border-[#673419] bg-[#2a170d] px-4 py-3 font-sans text-sm text-[#ffb286]">
              {profileErrorMessage}
            </div>
          ) : null}
        </aside>

        <section className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xs tracking-[0.1em] text-[#8d9fa3] uppercase">Bounties Preview</h2>
              <Link href="/community/bounties" className="font-sans text-sm text-[#8d9fa3] transition-colors hover:text-[#FF6B00]">
                View All
              </Link>
            </div>
            <BountyBoard bounties={previewBounties} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xs tracking-[0.1em] text-[#8d9fa3] uppercase">Social Feed Preview</h2>
              <Link href="/community/feed" className="font-sans text-sm text-[#8d9fa3] transition-colors hover:text-[#FF6B00]">
                View All
              </Link>
            </div>
            <AchievementFeed
              posts={previewPosts}
              onLike={handleLike}
              likedPostIds={likedPostIds}
              pendingLikePostIds={pendingLikePostIds}
            />
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xs tracking-[0.1em] text-[#8d9fa3] uppercase">Daily Relic</h2>
              <Link href="/community/profile" className="font-sans text-sm text-[#8d9fa3] transition-colors hover:text-[#FF6B00]">
                View
              </Link>
            </div>
            <DailyRelicStatus relic={dailyRelic} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xs tracking-[0.1em] text-[#8d9fa3] uppercase">Live Chat Preview</h2>
              <Link href="/community/chat" className="font-sans text-sm text-[#8d9fa3] transition-colors hover:text-[#FF6B00]">
                View All
              </Link>
            </div>
            <LiveChatPreview />
          </div>
        </aside>
      </div>
    </div>
  )
}
