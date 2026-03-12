"use client"

import { useState } from "react"

import { AchievementComposer } from "@/components/community/achievement-composer"
import { AchievementFeed } from "@/components/community/achievement-feed"
import { BountyBoard } from "@/components/community/bounty-board"
import { CommunityNavbar } from "@/components/community/community-navbar"
import { DailyRelicStatus } from "@/components/community/daily-relic-status"
import { LiveChatPanel } from "@/components/community/live-chat-panel"
import { PlayerProfileSidebar } from "@/components/community/player-profile-sidebar"
import type {
  AchievementPost,
  Bounty,
  ChatMessage,
  DailyRelic,
  NavLink,
  PlayerProfile,
} from "@/components/community/types"

interface CommunityHubProps {
  navLinks: NavLink[]
  profile: PlayerProfile
  bounties: Bounty[]
  achievementPosts: AchievementPost[]
  liveChatMessages: ChatMessage[]
  relic: DailyRelic
}

export function CommunityHub({
  navLinks,
  profile,
  bounties,
  achievementPosts,
  liveChatMessages,
  relic,
}: CommunityHubProps) {
  const [postDraft, setPostDraft] = useState("")

  return (
    <div className="min-h-screen bg-[#020b0d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(56%_70%_at_78%_12%,rgba(160,102,47,0.16)_0%,rgba(2,11,13,0)_70%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(5,16,20,0.93)_0%,rgba(2,11,13,0.97)_45%,rgba(1,7,9,1)_100%)]" />

      <div className="relative z-10">
        <CommunityNavbar links={navLinks} />

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
            <div className="xl:sticky xl:top-24 xl:self-start">
              <PlayerProfileSidebar profile={profile} />
            </div>

            <section className="space-y-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
              <BountyBoard bounties={bounties} />
              <AchievementComposer value={postDraft} onChange={setPostDraft} />
              <AchievementFeed posts={achievementPosts} />
            </section>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <DailyRelicStatus relic={relic} />
              <LiveChatPanel messages={liveChatMessages} />
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
