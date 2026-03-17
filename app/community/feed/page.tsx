"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import type { RealtimePostgresInsertPayload, SupabaseClient } from "@supabase/supabase-js"

import { AchievementComposer } from "@/components/community/achievement-composer"
import { AchievementFeed } from "@/components/community/achievement-feed"
import type { AchievementPost } from "@/components/community/types"
import { getStoredAccessToken } from "@/lib/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type RealtimePostRow = Record<string, unknown>

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
    content: pickString(row, ["content", "body", "text"]),
    likes: pickNumber(row, ["likes", "like_count", "likes_count"]),
    comments: pickNumber(row, ["comments", "comment_count", "comments_count"]),
    shares: pickNumber(row, ["shares", "share_count", "shares_count"]),
  }
}

export default function CommunityFeedPage() {
  const [postDraft, setPostDraft] = useState("")
  const [posts, setPosts] = useState<AchievementPost[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [postErrorMessage, setPostErrorMessage] = useState("")

  const handleCreatePost = async () => {
    const content = postDraft.trim()

    if (!content || isPosting) {
      return
    }

    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      setPostErrorMessage("Failed to post. Please try again")
      return
    }

    setIsPosting(true)
    setPostErrorMessage("")

    try {
      await axios.post(
        "http://localhost:3000/posts",
        { content },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      setPostDraft("")
      // New post appears via realtime insert listener once persisted.
    } catch {
      setPostErrorMessage("Failed to post. Please try again")
    } finally {
      setIsPosting(false)
    }
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      console.warn("[CommunityFeedPage] Supabase client not available")
      return
    }

    let isSubscribed = true

    const loadPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        const mappedPosts = await Promise.all(
          (data ?? []).map((postRow) => mapRealtimePostToAchievementPost(supabase, postRow as RealtimePostRow)),
        )

        if (!isSubscribed) {
          return
        }

        setPosts((prevPosts) => mergePosts(prevPosts, mappedPosts))
      } catch (error) {
        console.error("[CommunityFeedPage] Error loading initial posts:", error)
      }
    }

    void loadPosts()

    const channel = supabase
      .channel("community-feed-posts")
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
            const mappedPost = await mapRealtimePostToAchievementPost(supabase, payload.new)

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
      .subscribe((status) => {
        console.log("[CommunityFeedPage] Subscription status:", status)
      })

    return () => {
      isSubscribed = false
      void supabase.removeChannel(channel)
    }
  }, [])

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
      />
      <AchievementFeed posts={posts} />
    </div>
  )
}
