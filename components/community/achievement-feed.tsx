/**
 * What: Reusable social feed list that renders posts and interaction controls.
 * Why: Gives dashboard and feed pages one shared UI source for like-state rendering.
 */
import { Heart, MessageSquare, Share2 } from "lucide-react"

import type { AchievementPost } from "@/components/community/types"

interface AchievementFeedProps {
  posts: AchievementPost[]
  onLike?: (postId: string) => void
  likedPostIds?: Set<string>
  pendingLikePostIds?: Set<string>
  highlightedPostId?: string
}

export function AchievementFeed({ posts, onLike, likedPostIds, pendingLikePostIds, highlightedPostId }: AchievementFeedProps) {
  return (
    <section className="space-y-4">
      {posts.map((post) => {
        // Heart color source of truth lives here: if post id is in the set, show liked style.
        const isLiked = Boolean(likedPostIds?.has(post.id))
        const isHighlighted = highlightedPostId === post.id

        return (
        <article
          id={post.id}
          key={post.id}
          className={`rounded-2xl border bg-[#041419]/85 p-5 transition-all duration-700 sm:p-6 ${
            isHighlighted
              ? "border-[#ff9a3d] shadow-[0_0_0_1px_rgba(255,154,61,0.55),0_0_26px_rgba(255,107,0,0.35)]"
              : "border-[#1c2f33]"
          }`}
        >
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
            {/* Like button UI hook: click toggles in parent, this component only reflects state. */}
            <button
              type="button"
              onClick={() => onLike?.(post.id)}
              disabled={!onLike || pendingLikePostIds?.has(post.id)}
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#ff620f] disabled:cursor-not-allowed disabled:opacity-70"
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              <Heart size={16} className={isLiked ? "fill-red-500 text-red-500" : "text-gray-400"} />
              {post.likes}
            </button>
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
      )})}
    </section>
  )
}
