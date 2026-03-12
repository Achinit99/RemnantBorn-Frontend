import { bounties } from "@/app/community/mock-data"
import { BountyBoard } from "@/components/community/bounty-board"

export default function CommunityBountiesPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Bounty Board</h1>
        <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">Full bounty listing from mock data.</p>
      </header>
      <BountyBoard bounties={bounties} />
    </div>
  )
}
