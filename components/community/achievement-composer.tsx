/**
 * What: Post composer card for creating a new community achievement update.
 * Why: Keeps textarea, submit state, and error display packaged into one reusable block.
 */
"use client"

import { ImagePlus, Send, X } from "lucide-react"
import { useId } from "react"
import type { ChangeEvent, FormEvent } from "react"

interface AchievementComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void | Promise<void>
  isSubmitting?: boolean
  errorMessage?: string
  imagePreviewUrl?: string | null
  onImageSelected?: (file: File | null) => void
  onClearImage?: () => void
}

export function AchievementComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  imagePreviewUrl,
  onImageSelected,
  onClearImage,
}: AchievementComposerProps) {
  const fileInputId = useId()

  // Small submit gate so we don't trigger duplicate post calls.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isSubmitting) {
      void onSubmit?.()
    }
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null
    onImageSelected?.(selectedFile)
    event.target.value = ""
  }

  const isPostDisabled = isSubmitting || (value.trim().length === 0 && !imagePreviewUrl)

  return (
    <section className="glass-card-3d rounded-2xl p-5 sm:p-6">
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

        {imagePreviewUrl ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#7a6222]/45 bg-black/30 p-2">
            <div className="relative h-28 overflow-hidden rounded-md">
              <img src={imagePreviewUrl} alt="Selected upload preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={onClearImage}
                className="absolute top-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#664013] bg-black/70 text-[#ffd08a] transition-colors hover:border-[#ffcf66] hover:text-[#ffe0a8]"
                aria-label="Remove selected image"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input id={fileInputId} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <label
              htmlFor={fileInputId}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#2b474f] bg-black/35 text-[#8dc8d0] transition-colors hover:border-[#73dae3] hover:text-[#b4f3fb]"
              aria-label="Attach image"
              title="Attach image"
            >
              <ImagePlus size={18} />
            </label>
            <p className="font-sans text-xs text-[#8d9fa3]">Optional image (max 2MB)</p>
          </div>
        </div>

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
