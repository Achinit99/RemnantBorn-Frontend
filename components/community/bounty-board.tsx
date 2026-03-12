import { Target } from "lucide-react"

import type { Bounty } from "@/components/community/types"

interface BountyBoardProps {
  bounties: Bounty[]
}

const difficultyStyles: Record<Bounty["difficulty"], string> = {
  Easy: "border-[#3c4d23] bg-[#1a2911] text-[#a4e25f]",
  Medium: "border-[#5a451d] bg-[#2e2412] text-[#ffc46d]",
  Hard: "border-[#5b2525] bg-[#2f1414] text-[#ff8f8f]",
}

export function BountyBoard({ bounties }: BountyBoardProps) {
  return (
    <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Target className="text-[#ff620f]" size={20} />
        <h2 className="font-sans text-xl tracking-[0.08em] text-[#ff620f]">Bounty Board</h2>
      </div>

      <div className="mt-4 space-y-3">
        {bounties.map((bounty) => (
          <article
            key={bounty.id}
            className="rounded-xl border border-[#153038] bg-[#071a1f] p-4 transition-colors hover:border-[#1d4f5b]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-xl font-semibold text-[#e6edf0]">{bounty.title}</p>
              <span className={`rounded-full border px-3 py-1 font-sans text-xs ${difficultyStyles[bounty.difficulty]}`}>
                {bounty.difficulty}
              </span>
            </div>
            <p className="mt-2 font-sans text-lg font-semibold text-[#ff620f]">{bounty.reward}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
