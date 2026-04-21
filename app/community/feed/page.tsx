/**
 * What: Full social feed page with post composer, likes, and realtime synchronization.
 * Why: Handles the heavy social logic so feed interactions stay fast and consistent.
 */
"use client"

import axios from "axios"
import { useCallback, useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type {
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  SupabaseClient,
} from "@supabase/supabase-js"
import { toast } from "sonner"

import { AchievementComposer } from "@/components/community/achievement-composer"
import { AchievementFeed } from "@/components/community/achievement-feed"
import type { AchievementPost } from "@/components/community/types"
import { getStoredAccessToken } from "@/lib/auth"
import { getApiBaseUrl } from "@/lib/api-config"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type RealtimePostRow = Record<string, unknown>
type RealtimeLikeRow = Record<string, unknown>
type RealtimeCommentRow = Record<string, unknown>
type PostAttachment = { type?: string; url?: string }

const COMMUNITY_SOCIAL_SYNC_CHANNEL = "community-social-sync"
const FEED_POSTS_PAGE_SIZE = 10
const POST_IMAGES_BUCKET = "post-images"
const MAX_POST_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

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

function pickString(row: RealtimePostRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return ""
}

function parseJsonValue(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function normalizeAttachments(value: unknown): PostAttachment[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is PostAttachment => Boolean(entry) && typeof entry === "object")
  }

  if (typeof value === "string") {
    const parsed = parseJsonValue(value)

    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is PostAttachment => Boolean(entry) && typeof entry === "object")
    }
  }

  return []
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

function extractImageUrlFromAttachments(row: RealtimePostRow): string {
  const attachments = normalizeAttachments(row.attachments)

  if (attachments.length === 0) {
    const legacyImageUrl = pickString(row, ["image_url", "imageUrl"])

    if (legacyImageUrl) {
      return legacyImageUrl
    }
  }

  for (const attachment of attachments) {
    if (!attachment || typeof attachment !== "object") {
      continue
    }

    if (attachment.type === "image" && typeof attachment.url === "string" && attachment.url.trim().length > 0) {
      return attachment.url.trim()
    }
  }

  return ""
}

function debugRealtimeInsertPost(row: RealtimePostRow) {
  const postId = pickString(row, ["id"])
  const content = pickString(row, ["content", "body", "text", "caption"])
  const attachments = normalizeAttachments(row.attachments)
  const attachmentCount = attachments.length

  console.debug("[CommunityFeedPage] Realtime INSERT normalized post", {
    postId,
    content,
    contentLength: content.length,
    attachmentCount,
    attachments,
  })

  toast.info(`Realtime post: content=${content.length} chars, attachments=${attachmentCount}`)
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

async function fetchLikeCountsByPostId(supabase: SupabaseClient, postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) {
    return {}
  }

  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .in("post_id", postIds)

  if (error) {
    throw error
  }

  const countsByPostId: Record<string, number> = {}

  for (const row of data ?? []) {
    const postId = pickString(row as RealtimeLikeRow, ["post_id"])

    if (!postId) {
      continue
    }

    countsByPostId[postId] = (countsByPostId[postId] ?? 0) + 1
  }

  return countsByPostId
}

async function fetchLikeCountForPost(supabase: SupabaseClient, postId: string): Promise<number> {
  if (!postId) {
    return 0
  }

  const { count, error } = await supabase
    .from("post_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId)

  if (error) {
    throw error
  }

  return count ?? 0
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

  console.warn("[CommunityFeedPage] Author lookup fallback used for realtime post", {
    authorId,
    profileError: profileResult.error,
    userError: userResult.error,
  })

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
    content: pickString(row, ["content", "body", "text", "caption"]),
    imageUrl: extractImageUrlFromAttachments(row) || null,
    likes: pickNumber(row, ["likes", "like_count", "likes_count"]),
    comments: pickNumber(row, ["comments", "comment_count", "comments_count"]),
    shares: pickNumber(row, ["shares", "share_count", "shares_count"]),
  }
}

async function fetchPostsPage(supabase: SupabaseClient, from: number, to: number): Promise<AchievementPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    throw error
  }

  const mappedPosts = await Promise.all(
    (data ?? []).map((postRow) => mapRealtimePostToAchievementPost(supabase, postRow as RealtimePostRow)),
  )

  const postIds = mappedPosts.map((post) => post.id)
  const likeCountsByPostId = await fetchLikeCountsByPostId(supabase, postIds)

  return mappedPosts.map((post) => ({
    ...post,
    likes: likeCountsByPostId[post.id] ?? post.likes,
  }))
}

export default function CommunityFeedPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [postDraft, setPostDraft] = useState("")
  const [posts, setPosts] = useState<AchievementPost[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [pendingLikePostIds, setPendingLikePostIds] = useState<Set<string>>(new Set())
  const [isPosting, setIsPosting] = useState(false)
  const [postErrorMessage, setPostErrorMessage] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null)
  const [highlightedPostId, setHighlightedPostId] = useState("")
  const [forceOpenCommentPostId, setForceOpenCommentPostId] = useState("")
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [nextPostsRangeStart, setNextPostsRangeStart] = useState(0)
  const supabaseAuthUserIdRef = useRef("")
  const didShowMissingSessionAlertRef = useRef(false)
  const likedPostIdsRef = useRef<Set<string>>(new Set())
  const pendingLikePostIdsRef = useRef<Set<string>>(new Set())

  // Keeping refs in sync here so fast clicks always read the latest truth.
  useEffect(() => {
    likedPostIdsRef.current = likedPostIds
  }, [likedPostIds])

  // Same idea for pending likes, this avoids duplicate requests when button spam happens.
  useEffect(() => {
    pendingLikePostIdsRef.current = pendingLikePostIds
  }, [pendingLikePostIds])

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

    if (sessionResult.error) {
      console.error("[CommunityFeedPage] Failed to get session in handleLike:", sessionResult.error.message || sessionResult.error)
    }

    const sessionUserId = sessionResult.data.session?.user?.id ?? ""
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser()

    if (getUserError) {
      console.error("[CommunityFeedPage] Failed to get user in handleLike:", getUserError.message || getUserError)
    }

    console.log("Full Auth User Object:", user)

    const userId = sessionUserId || user?.id || supabaseAuthUserIdRef.current || currentUserId
    console.log("Current User ID in handleLike:", userId)

    if (!userId) {
      console.error("[AuthDebug] No user found in Supabase Auth")

      if (!didShowMissingSessionAlertRef.current) {
        didShowMissingSessionAlertRef.current = true
        window.alert("Please log in to like posts")
      }

      console.error("[CommunityFeedPage] Missing Supabase auth user id for like toggle")
      return
    }

    const isAlreadyLiked = likedPostIdsRef.current.has(postId)
    const shouldLike = !isAlreadyLiked
    const optimisticDelta = shouldLike ? 1 : isAlreadyLiked ? -1 : 0

    // === Ownership Guard ===
    // Only allow unlike decrement if this user actually owns a like for this post.
    if (!shouldLike && !isAlreadyLiked) {
      return
    }

    if (shouldLike) {
      setPosts((prevPosts) => incrementPostLike(prevPosts, postId, optimisticDelta))
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
        setPosts((prevPosts) => incrementPostLike(prevPosts, postId, optimisticDelta))
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

      if (!shouldLike) {
        // This part handles UI sync with DB truth after unlike, so counts never drift.
        try {
          const confirmedLikeCount = await fetchLikeCountForPost(supabase, postId)
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    likes: confirmedLikeCount,
                  }
                : post,
            ),
          )
        } catch (syncError) {
          console.error("[CommunityFeedPage] Failed to sync like count after unlike:", syncError)
        }
      }
    } catch (error) {
      if (shouldLike && getErrorCode(error) === "23505") {
        // Already liked by this user. Roll back optimistic count, but keep liked state.
        setPosts((prevPosts) => incrementPostLike(prevPosts, postId, -1))
        setLikedPostIds((prev) => {
          const next = new Set(prev)
          next.add(postId)
          likedPostIdsRef.current = next
          return next
        })
        return
      }

      setPosts((prevPosts) => incrementPostLike(prevPosts, postId, -optimisticDelta))
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
      console.error("[CommunityFeedPage] Error toggling like:", normalizedError?.message || error)

      if (!shouldLike) {
        const deleteVerification = await supabase
          .from("post_likes")
          .select("post_id, user_id")
          .eq("post_id", postId)
          .eq("user_id", userId)
          .maybeSingle()

        if (deleteVerification.error) {
          console.error(
            "[CommunityFeedPage] Delete verification failed (possible RLS/permission issue):",
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
              "[CommunityFeedPage] Failed to resolve auth session:",
              sessionResult.error.message || sessionResult.error,
            )
          }

          resolvedUserId = sessionResult.data.session?.user?.id ?? ""
        }

        if (decodedTokenUserId && resolvedUserId && decodedTokenUserId !== resolvedUserId) {
          console.warn("[CommunityFeedPage] User ID mismatch detected", {
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
        console.error("[CommunityFeedPage] Auth sync failed:", error)
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
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl)
      }
    }
  }, [selectedImagePreviewUrl])

  const handleSelectPostImage = (file: File | null) => {
    if (!file) {
      return
    }

    if (file.size > MAX_POST_IMAGE_SIZE_BYTES) {
      setPostErrorMessage("Image must be 2MB or smaller.")
      return
    }

    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedImageFile(file)
    setSelectedImagePreviewUrl(previewUrl)
    setPostErrorMessage("")
  }

  const clearSelectedPostImage = () => {
    if (selectedImagePreviewUrl) {
      URL.revokeObjectURL(selectedImagePreviewUrl)
    }

    setSelectedImageFile(null)
    setSelectedImagePreviewUrl(null)
  }

  const handleCreatePost = async () => {
    const content = postDraft.trim()

    if ((!content && !selectedImageFile) || isPosting) {
      return
    }

    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      setPostErrorMessage("Failed to post. Please try again")
      return
    }

    setIsPosting(true)
    setPostErrorMessage("")

    let uploadedImagePath = ""

    try {
      let uploadedImageUrl = ""
      let attachments: Array<{ type: string; url: string }> = []
      const supabase = getSupabaseBrowserClient()

      if (selectedImageFile) {
        if (!supabase) {
          setPostErrorMessage("Storage is currently unavailable. Please try again.")
          setIsPosting(false)
          return
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user?.id) {
          setPostErrorMessage("Failed to verify your session for image upload.")
          setIsPosting(false)
          return
        }

        const extension = selectedImageFile.name.split(".").pop()?.toLowerCase() || "jpg"
        uploadedImagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from(POST_IMAGES_BUCKET)
          .upload(uploadedImagePath, selectedImageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: selectedImageFile.type,
          })

        if (uploadError) {
          throw new Error(uploadError.message || "Failed to upload image")
        }

        const { data: publicUrlData } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(uploadedImagePath)
        uploadedImageUrl = publicUrlData.publicUrl || ""
        attachments = uploadedImageUrl ? [{ type: "image", url: uploadedImageUrl }] : []
      }

      await axios.post(
        `${getApiBaseUrl()}/posts`,
        {
          content: content || " ",
          attachments,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      setPostDraft("")
      clearSelectedPostImage()
      // New post appears via realtime insert listener once persisted.
    } catch (error) {
      if (uploadedImagePath) {
        const supabase = getSupabaseBrowserClient()
        if (supabase) {
          await supabase.storage.from(POST_IMAGES_BUCKET).remove([uploadedImagePath])
        }
      }

      console.error("[CommunityFeedPage] Failed to create post with image:", error)
      setPostErrorMessage("Failed to post. Please try again")
    } finally {
      setIsPosting(false)
    }
  }

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMorePosts || !hasMorePosts) {
      return
    }

    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      return
    }

    setIsLoadingMorePosts(true)

    try {
      const from = nextPostsRangeStart
      const to = from + FEED_POSTS_PAGE_SIZE - 1
      const nextPagePosts = await fetchPostsPage(supabase, from, to)

      if (nextPagePosts.length === 0) {
        setHasMorePosts(false)
        return
      }

      setPosts((prevPosts) => mergePosts(prevPosts, nextPagePosts))
      setNextPostsRangeStart(from + nextPagePosts.length)
      setHasMorePosts(nextPagePosts.length === FEED_POSTS_PAGE_SIZE)
    } catch (error) {
      console.error("[CommunityFeedPage] Error loading more posts:", error)
    } finally {
      setIsLoadingMorePosts(false)
    }
  }, [hasMorePosts, isLoadingMorePosts, nextPostsRangeStart])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      console.warn("[CommunityFeedPage] Supabase client not available")
      return
    }

    let isSubscribed = true

    const loadPosts = async () => {
      try {
        const sessionResult = await supabase.auth.getSession()

        if (sessionResult.error) {
          console.error("[CommunityFeedPage] Initial session check failed:", sessionResult.error.message || sessionResult.error)
        }

        const sessionUserId = sessionResult.data.session?.user?.id ?? ""

        if (isSubscribed && sessionUserId) {
          supabaseAuthUserIdRef.current = sessionUserId
          setCurrentUserId(sessionUserId)
        }

        const firstPagePosts = await fetchPostsPage(supabase, 0, FEED_POSTS_PAGE_SIZE - 1)

        if (!isSubscribed) {
          return
        }

        setPosts((prevPosts) => mergePosts(prevPosts, firstPagePosts))
        setNextPostsRangeStart(firstPagePosts.length)
        setHasMorePosts(firstPagePosts.length === FEED_POSTS_PAGE_SIZE)
      } catch (error) {
        console.error("[CommunityFeedPage] Error loading initial posts:", error)
      }
    }

    void loadPosts()

    // === Realtime Events Handled Here ===
    // Fixing the double-counting bug here by reconciling with DB count per event.
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
          console.log("[CommunityFeedPage] Received realtime payload:", payload)

          if (!isSubscribed) {
            return
          }

          try {
            const row = ((payload as { new?: RealtimePostRow; record?: RealtimePostRow }).new ??
              (payload as { record?: RealtimePostRow }).record ??
              {}) as RealtimePostRow

            debugRealtimeInsertPost(row)
            const mappedPost = await mapRealtimePostToAchievementPost(supabase, row)

            if (!isSubscribed) {
              return
            }

            setPosts((prevPosts) => {
              return mergePosts([mappedPost], prevPosts)
            })
          } catch (error) {
            console.error("[CommunityFeedPage] Error processing realtime payload:", error)
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
          if (!isSubscribed) {
            return
          }

          const updatedPostId = pickString(payload.new, ["id"])

          if (!updatedPostId) {
            return
          }

          const authoritativeLikeCount = pickNumber(payload.new, ["likes", "like_count", "likes_count"])
          const authoritativeCommentCount = pickNumber(payload.new, ["comments", "comment_count", "comments_count"])

          // Trigger-backed posts columns are canonical; reconcile local optimistic values.
          setPosts((prevPosts) =>
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
          if (!isSubscribed) {
            return
          }

          const commentedPostId = pickString(payload.new, ["post_id"])

          if (!commentedPostId) {
            return
          }

          // Optimistic live bump for all viewers; UPDATE on posts will reconcile authoritative count.
          setPosts((prevPosts) => incrementPostComment(prevPosts, commentedPostId, 1))
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
          if (!isSubscribed) {
            return
          }

          const commentedPostId = pickString(payload.old, ["post_id"])

          if (!commentedPostId) {
            return
          }

          // Optimistic live decrement for all viewers; UPDATE on posts will reconcile authoritative count.
          setPosts((prevPosts) => incrementPostComment(prevPosts, commentedPostId, -1))
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
          if (!isSubscribed) {
            return
          }

          const likedPostId = pickString(payload.new, ["post_id"])
          const likedByUserId = pickString(payload.new, ["user_id"])

          if (!likedPostId) {
            return
          }

          if (likedByUserId && supabaseAuthUserIdRef.current && likedByUserId === supabaseAuthUserIdRef.current) {
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

          // For likes, we trust DB count as source of truth to avoid local drift.
          try {
            const confirmedLikeCount = await fetchLikeCountForPost(supabase, likedPostId)

            if (!isSubscribed) {
              return
            }

            setPosts((prevPosts) =>
              prevPosts.map((post) =>
                post.id === likedPostId
                  ? {
                      ...post,
                      likes: confirmedLikeCount,
                    }
                  : post,
              ),
            )
          } catch (error) {
            console.error("[CommunityFeedPage] Failed to sync like count from realtime INSERT:", error)
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
        async (payload: RealtimePostgresDeletePayload<RealtimeLikeRow>) => {
          if (!isSubscribed) {
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

          // For unlikes too, syncing from DB keeps everyone's count accurate.
          try {
            const confirmedLikeCount = await fetchLikeCountForPost(supabase, likedPostId)

            if (!isSubscribed) {
              return
            }

            setPosts((prevPosts) =>
              prevPosts.map((post) =>
                post.id === likedPostId
                  ? {
                      ...post,
                      likes: confirmedLikeCount,
                    }
                  : post,
              ),
            )
          } catch (error) {
            console.error("[CommunityFeedPage] Failed to sync like count from realtime DELETE:", error)
          }
        },
      )
      .subscribe((status) => {
        console.log("[CommunityFeedPage] Subscription status:", status)
      })

    return () => {
      isSubscribed = false
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase || isAuthLoading || !currentUserId || posts.length === 0) {
      return
    }

    let isActive = true

    // Setting up the user-like sync here so heart colors stay honest after refresh/reconnect.
    const syncLikedPostIds = async () => {
      try {
        const postIds = posts.map((post) => post.id)
        const likedPostIdsForUser = await fetchLikedPostIdsForUser(supabase, currentUserId, postIds)

        if (isActive) {
          setLikedPostIds(likedPostIdsForUser)
          likedPostIdsRef.current = likedPostIdsForUser
        }
      } catch (error) {
        console.error("[CommunityFeedPage] Error syncing liked posts for auth user:", error)
      }
    }

    void syncLikedPostIds()

    return () => {
      isActive = false
    }
  }, [currentUserId, isAuthLoading, posts])

  useEffect(() => {
    const deepLinkedPostId = searchParams.get("postId")?.trim() ?? ""
    const shouldOpenComments = searchParams.get("openComments") === "1"

    if (!deepLinkedPostId || posts.length === 0) {
      return
    }

    const postExists = posts.some((post) => post.id === deepLinkedPostId)

    if (!postExists) {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete("postId")
      nextParams.delete("openComments")
      const nextQuery = nextParams.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
      return
    }

    const scrollTarget = document.getElementById(deepLinkedPostId)

    if (!scrollTarget) {
      return
    }

    scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" })
    setHighlightedPostId(deepLinkedPostId)

    if (shouldOpenComments) {
      setForceOpenCommentPostId(deepLinkedPostId)
    }

    const clearHighlightTimeout = window.setTimeout(() => {
      setHighlightedPostId((current) => (current === deepLinkedPostId ? "" : current))
    }, 3000)

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete("postId")
    nextParams.delete("openComments")
    const nextQuery = nextParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })

    return () => {
      window.clearTimeout(clearHighlightTimeout)
    }
  }, [pathname, posts, router, searchParams])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Social Feed</h1>
        <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">Full achievement feed from the database.</p>
      </header>
      <AchievementComposer
        value={postDraft}
        onChange={(value) => {
          setPostDraft(value)

          if (postErrorMessage) {
            setPostErrorMessage("")
          }
        }}
        onSubmit={handleCreatePost}
        isSubmitting={isPosting}
        errorMessage={postErrorMessage}
        imagePreviewUrl={selectedImagePreviewUrl}
        onImageSelected={handleSelectPostImage}
        onClearImage={clearSelectedPostImage}
      />
      <AchievementFeed
        posts={posts}
        onLike={handleLike}
        likedPostIds={likedPostIds}
        pendingLikePostIds={pendingLikePostIds}
        highlightedPostId={highlightedPostId}
        forceOpenCommentPostId={forceOpenCommentPostId}
        onForceOpenCommentPostHandled={() => {
          setForceOpenCommentPostId("")
        }}
        onLoadMorePosts={() => {
          void loadMorePosts()
        }}
        isLoadingMorePosts={isLoadingMorePosts}
        hasMorePosts={hasMorePosts}
        showEndOfFeedMessage={!hasMorePosts && posts.length > 0}
      />
    </div>
  )
}
