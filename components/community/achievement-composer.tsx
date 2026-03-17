"use client"

import { Send } from "lucide-react"
import type { FormEvent } from "react"

interface AchievementComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void | Promise<void>
  isSubmitting?: boolean
  errorMessage?: string
}

export function AchievementComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: AchievementComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isSubmitting) {
      void onSubmit?.()
    }
  }

  const isPostDisabled = isSubmitting || value.trim().length === 0

  return (
    <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
      <form onSubmit={handleSubmit}>
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

        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-[#7b3d33] bg-[#2a120f]/80 px-3 py-2 font-sans text-xs text-[#f0c2b6]">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPostDisabled}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff620f] px-4 py-3 font-sans text-sm font-semibold text-black transition-colors hover:bg-[#ff7b36] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send size={16} />
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </form>
    </section>
  )
}
