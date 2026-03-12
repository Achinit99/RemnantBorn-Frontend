"use client"

import { useState } from "react"

import { achievementPosts } from "@/app/community/mock-data"
import { AchievementComposer } from "@/components/community/achievement-composer"
import { AchievementFeed } from "@/components/community/achievement-feed"

export default function CommunityFeedPage() {
  const [postDraft, setPostDraft] = useState("")

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Social Feed</h1>
        <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">Full achievement feed from mock data.</p>
      </header>
      <AchievementComposer value={postDraft} onChange={setPostDraft} />
      <AchievementFeed posts={achievementPosts} />
    </div>
  )
}
