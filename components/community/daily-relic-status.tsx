import { Sparkles } from "lucide-react"

import type { DailyRelic } from "@/components/community/types"

interface DailyRelicStatusProps {
  relic: DailyRelic
}

export function DailyRelicStatus({ relic }: DailyRelicStatusProps) {
  return (
    <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
      <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#ff620f] bg-[#071a1f]">
        <Sparkles size={44} className="text-[#ff620f]" />
      </div>

      <p className="mt-4 text-center font-display text-3xl font-semibold text-[#e6edf0]">{relic.title}</p>
      <p className="mt-2 text-center font-sans text-sm text-[#8d9fa3]">Daily status</p>

      <button
        type="button"
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#965012] px-4 py-3 font-sans text-sm font-semibold text-black"
      >
        {relic.status}
      </button>
    </section>
  )
}
