/**
 * What: Bounty list card that shows mission title, reward, and difficulty badge.
 * Why: Reuses one clean layout for both dashboard previews and full bounty page.
 */
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
    <section className="glass-card-3d rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Target className="text-[#ff620f]" size={20} />
        <h2 className="glass-title-gold font-sans text-xl tracking-[0.08em]">Bounty Board</h2>
      </div>

      <div className="mt-4 space-y-3">
        {bounties.map((bounty) => (
          <article
            key={bounty.id}
            className="rounded-xl border border-[#153038] bg-black/40 p-4 backdrop-blur-xl transition-colors hover:border-[#1d4f5b]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="glass-title-gold font-display text-xl font-semibold">{bounty.title}</p>
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
