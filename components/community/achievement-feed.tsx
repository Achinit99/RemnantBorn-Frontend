import { Heart, MessageSquare, Share2 } from "lucide-react"

import type { AchievementPost } from "@/components/community/types"

interface AchievementFeedProps {
  posts: AchievementPost[]
}

export function AchievementFeed({ posts }: AchievementFeedProps) {
  return (
    <section className="space-y-4">
      {posts.map((post) => (
        <article key={post.id} className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-full border border-[#1d4f5b] bg-[#071a1f]">
              {post.avatarUrl ? (
                <img src={post.avatarUrl} alt={post.author} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#0f2a31] font-display text-base font-bold text-[#ff620f]">
                  {post.author.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-[#e6edf0]">{post.author}</p>
              <p className="font-sans text-xs text-[#8d9fa3]">{post.postedAt}</p>
            </div>
          </div>

          <p className="mt-4 font-sans text-base leading-relaxed text-[#d4dee1]">{post.content}</p>

          <div className="mt-4 flex items-center gap-5 text-[#8d9fa3]">
            <span className="inline-flex items-center gap-2 text-sm">
              <Heart size={16} />
              {post.likes}
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <MessageSquare size={16} />
              {post.comments}
            </span>
            <span className="inline-flex items-center gap-2 text-sm">
              <Share2 size={16} />
              {post.shares}
            </span>
          </div>
        </article>
      ))}
    </section>
  )
}
