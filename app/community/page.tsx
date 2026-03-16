"use client"

import axios from "axios"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  dailyRelic,
  achievementPosts,
  bounties,
  liveChatMessages,
} from "@/app/community/mock-data"
import { AchievementFeed } from "@/components/community/achievement-feed"
import { BountyBoard } from "@/components/community/bounty-board"
import { DailyRelicStatus } from "@/components/community/daily-relic-status"
import { LiveChatPanel } from "@/components/community/live-chat-panel"
import type { PlayerProfile } from "@/components/community/types"
import { PlayerProfileSidebar } from "@/components/community/player-profile-sidebar"
import { getApiErrorMessage } from "@/lib/auth-api"
import { clearClientAuthSession, getStoredAccessToken } from "@/lib/auth"
import { getUserProfile, mapProfileResponseToPlayerProfile } from "@/lib/profile.service"

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

  const previewBounties = bounties.slice(0, 3)
  const previewPosts = achievementPosts.slice(0, 3)
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
