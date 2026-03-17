"use client"

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { RealtimePostgresInsertPayload, SupabaseClient } from "@supabase/supabase-js"

import {
  dailyRelic,
  bounties,
  liveChatMessages,
} from "@/app/community/mock-data"
import { AchievementFeed } from "@/components/community/achievement-feed"
import { BountyBoard } from "@/components/community/bounty-board"
import { DailyRelicStatus } from "@/components/community/daily-relic-status"
import { LiveChatPanel } from "@/components/community/live-chat-panel"
import type { AchievementPost, PlayerProfile } from "@/components/community/types"
import { PlayerProfileSidebar } from "@/components/community/player-profile-sidebar"
import { getApiErrorMessage } from "@/lib/auth-api"
import { clearClientAuthSession, getStoredAccessToken } from "@/lib/auth"
import { getUserProfile, mapProfileResponseToPlayerProfile } from "@/lib/profile.service"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type RealtimePostRow = Record<string, unknown>

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
  const [previewPosts, setPreviewPosts] = useState<AchievementPost[]>([])

  const previewBounties = bounties.slice(0, 3)
  const previewChat = liveChatMessages.slice(0, 3)

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

        setPreviewPosts(mappedPosts)
      } catch (error) {
        console.error("[CommunityDashboardPage] Error loading preview posts:", error)
      }
    }

    void loadLatestPosts()

    const channel = supabase
      .channel("community-dashboard-preview-posts")
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
      .subscribe()

    return () => {
      isMounted = false
      void supabase.removeChannel(channel)
    }
  }, [])

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
            <AchievementFeed posts={previewPosts} />
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
            <LiveChatPanel messages={previewChat} />
          </div>
        </aside>
      </div>
    </div>
  )
}
