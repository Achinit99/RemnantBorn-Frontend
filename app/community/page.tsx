import Link from "next/link"

import {
  dailyRelic,
  achievementPosts,
  bounties,
  liveChatMessages,
  playerProfile,
} from "@/app/community/mock-data"
import { AchievementFeed } from "@/components/community/achievement-feed"
import { BountyBoard } from "@/components/community/bounty-board"
import { DailyRelicStatus } from "@/components/community/daily-relic-status"
import { LiveChatPanel } from "@/components/community/live-chat-panel"
import { PlayerProfileSidebar } from "@/components/community/player-profile-sidebar"

export default function CommunityDashboardPage() {
  const previewBounties = bounties.slice(0, 3)
  const previewPosts = achievementPosts.slice(0, 3)
  const previewChat = liveChatMessages.slice(0, 3)

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
          <PlayerProfileSidebar profile={playerProfile} />
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
