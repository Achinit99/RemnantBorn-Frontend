import { dailyRelic, playerProfile } from "@/app/community/mock-data"
import { DailyRelicStatus } from "@/components/community/daily-relic-status"
import { PlayerProfileSidebar } from "@/components/community/player-profile-sidebar"

export default function CommunityProfilePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Profile</h1>
        <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">Player profile details from mock data.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,420px)]">
        <PlayerProfileSidebar profile={playerProfile} />
        <DailyRelicStatus relic={dailyRelic} />
      </div>
    </div>
  )
}
