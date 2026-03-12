"use client"

import { Send } from "lucide-react"

interface AchievementComposerProps {
  value: string
  onChange: (value: string) => void
}

export function AchievementComposer({ value, onChange }: AchievementComposerProps) {
  return (
    <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
      <label htmlFor="achievement-post" className="sr-only">
        Share your achievement
      </label>
      <textarea
        id="achievement-post"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Share your achievements..."
        className="h-28 w-full resize-none rounded-xl border border-[#153038] bg-[#071a1f] px-4 py-3 font-sans text-sm text-[#e6edf0] placeholder:text-[#7f979d] focus:border-[#1d4f5b] focus:outline-none"
      />
      <button
        type="button"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff620f] px-4 py-3 font-sans text-sm font-semibold text-black transition-colors hover:bg-[#ff7b36]"
      >
        <Send size={16} />
        Post
      </button>
    </section>
  )
}
