/**
 * What: Reusable social feed list that renders posts, likes, and comment interactions.
 * Why: Gives dashboard and feed pages one shared UI source for social behavior.
 */
"use client"

import { Heart, MessageCircle, MessageSquare, Send, SendHorizontal } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { RealtimeChannel, RealtimePostgresInsertPayload, SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import type { AchievementPost, PostComment } from "@/components/community/types"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type RealtimeRow = Record<string, unknown>

interface AchievementFeedProps {
  posts: AchievementPost[]
  onLike?: (postId: string) => void
  likedPostIds?: Set<string>
  pendingLikePostIds?: Set<string>
  highlightedPostId?: string
  forceOpenCommentPostId?: string
  onForceOpenCommentPostHandled?: () => void
  onLoadMorePosts?: () => void
  isLoadingMorePosts?: boolean
  hasMorePosts?: boolean
  showEndOfFeedMessage?: boolean
}

function pickString(row: RealtimeRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return ""
}

async function fetchUserDisplayName(supabase: SupabaseClient, userId: string): Promise<string> {
  if (!userId) {
    return "Unknown Player"
  }

  const profileResult = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", userId)
    .maybeSingle()

  const profileUsername = pickString((profileResult.data as RealtimeRow | null) ?? {}, ["username"])

  if (!profileResult.error && profileUsername) {
    return profileUsername
  }

  const userResult = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .maybeSingle()

  const userUsername = pickString((userResult.data as RealtimeRow | null) ?? {}, ["username"])

  if (!userResult.error && userUsername) {
    return userUsername
  }

  return "Unknown Player"
}

async function fetchUserProfile(supabase: SupabaseClient, userId: string): Promise<{ avatarUrl?: string | null; username: string }> {
  if (!userId) {
    return { avatarUrl: null, username: "Unknown Player" }
  }

  const profileResult = await supabase
    .from("profiles")
    .select("avatar_url, username")
    .eq("user_id", userId)
    .maybeSingle()

  if (!profileResult.error && profileResult.data) {
    return {
      avatarUrl: profileResult.data.avatar_url || null,
      username: (profileResult.data.username as string) || "Unknown Player",
    }
  }

  return { avatarUrl: null, username: "Unknown Player" }
}

async function mapCommentRowToComment(
  supabase: SupabaseClient,
  row: RealtimeRow,
  usernameCache: Record<string, string>,
): Promise<PostComment> {
  const postId = pickString(row, ["post_id"])
  const userId = pickString(row, ["user_id"])
  const createdAt = pickString(row, ["created_at"]) || new Date().toISOString()
  const commentId = pickString(row, ["id"]) || `comment-${Date.now()}`
  const content = pickString(row, ["content"])

  let author = pickString(row, ["username", "author", "display_name"])
  let avatarUrl: string | null = null

  // Try to get avatar from joined user profile data
  const userProfile = row.user as RealtimeRow | null
  if (userProfile) {
    const profileAvatarUrl = pickString(userProfile, ["avatar_url"])
    if (profileAvatarUrl) {
      avatarUrl = profileAvatarUrl
    }
    const profileUsername = pickString(userProfile, ["username"])
    if (profileUsername && !author) {
      author = profileUsername
    }
  }

  // Fallback: try to get avatar from row directly (in case of missing join)
  if (!avatarUrl) {
    const rowAvatarUrl = pickString(row, ["avatar_url", "profile_avatar_url"])
    if (rowAvatarUrl) {
      avatarUrl = rowAvatarUrl
    }
  }

  if (!author && userId) {
    const profile = await fetchUserProfile(supabase, userId)
    author = profile.username
    if (!avatarUrl) {
      avatarUrl = profile.avatarUrl || null
    }
    usernameCache[userId] = author
  } else if (userId && !avatarUrl) {
    // Fetch avatar even if we have author name
    const profile = await fetchUserProfile(supabase, userId)
    avatarUrl = profile.avatarUrl || null
  }

  return {
    id: commentId,
    postId,
    userId,
    author: author || "Unknown Player",
    content,
    createdAt,
    avatarUrl,
  }
}

function sortCommentsByCreatedAt(comments: PostComment[]): PostComment[] {
  return [...comments].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt)
    const rightTime = Date.parse(right.createdAt)

    if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
      return left.createdAt.localeCompare(right.createdAt)
    }

    return leftTime - rightTime
  })
}

function upsertCommentList(prevComments: PostComment[], nextComment: PostComment, tempIdToReplace = ""): PostComment[] {
  const withoutTemp = tempIdToReplace ? prevComments.filter((comment) => comment.id !== tempIdToReplace) : prevComments
  const existingIndex = withoutTemp.findIndex((comment) => comment.id === nextComment.id)

  if (existingIndex === -1) {
    return sortCommentsByCreatedAt([...withoutTemp, nextComment])
  }

  const updated = [...withoutTemp]
  updated[existingIndex] = nextComment
  return sortCommentsByCreatedAt(updated)
}

export function AchievementFeed({
  posts,
  onLike,
  likedPostIds,
  pendingLikePostIds,
  highlightedPostId,
  forceOpenCommentPostId,
  onForceOpenCommentPostHandled,
  onLoadMorePosts,
  isLoadingMorePosts = false,
  hasMorePosts = false,
  showEndOfFeedMessage = false,
}: AchievementFeedProps) {
  const [openCommentPostIds, setOpenCommentPostIds] = useState<Set<string>>(new Set())
  const [loadingCommentPostIds, setLoadingCommentPostIds] = useState<Set<string>>(new Set())
  const [pendingCommentPostIds, setPendingCommentPostIds] = useState<Set<string>>(new Set())
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<string, string>>({})
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, PostComment[]>>({})
  const currentUserIdRef = useRef("")
  const usernameCacheRef = useRef<Record<string, string>>({})
  const loadedCommentPostIdsRef = useRef<Set<string>>(new Set())
  const commentChannelsRef = useRef<Record<string, RealtimeChannel>>({})
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase) {
      return
    }

    let isActive = true

    const syncAuthUser = async () => {
      const sessionResult = await supabase.auth.getSession()

      if (!isActive) {
        return
      }

      currentUserIdRef.current = sessionResult.data.session?.user?.id ?? ""
    }

    void syncAuthUser()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      currentUserIdRef.current = session?.user?.id ?? ""
    })

    return () => {
      isActive = false
      data.subscription.unsubscribe()

      const channels = Object.values(commentChannelsRef.current)

      for (const channel of channels) {
        void supabase.removeChannel(channel)
      }

      commentChannelsRef.current = {}
      loadedCommentPostIdsRef.current = new Set()
    }
  }, [])

  const attachCommentRealtimeForPost = useCallback((postId: string) => {
    const supabase = getSupabaseBrowserClient()

    if (!supabase || !postId || commentChannelsRef.current[postId]) {
      return
    }

    const channel = supabase
      .channel(`community-comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload: RealtimePostgresInsertPayload<RealtimeRow>) => {
          const mappedComment = await mapCommentRowToComment(supabase, payload.new, usernameCacheRef.current)

          setCommentsByPostId((prevCommentsByPostId) => {
            const existing = prevCommentsByPostId[postId] ?? []

            if (existing.some((comment) => comment.id === mappedComment.id)) {
              return prevCommentsByPostId
            }

            return {
              ...prevCommentsByPostId,
              [postId]: upsertCommentList(existing, mappedComment),
            }
          })
        },
      )
      .subscribe()

    commentChannelsRef.current[postId] = channel
  }, [])

  const openCommentsForPost = useCallback(
    async (postId: string) => {
      const supabase = getSupabaseBrowserClient()

      if (!supabase || !postId) {
        return
      }

      setOpenCommentPostIds((prevOpenCommentPostIds) => {
        const nextOpenCommentPostIds = new Set(prevOpenCommentPostIds)
        nextOpenCommentPostIds.add(postId)
        return nextOpenCommentPostIds
      })

      if (!loadedCommentPostIdsRef.current.has(postId)) {
        setLoadingCommentPostIds((prevLoadingCommentPostIds) => {
          const nextLoadingCommentPostIds = new Set(prevLoadingCommentPostIds)
          nextLoadingCommentPostIds.add(postId)
          return nextLoadingCommentPostIds
        })

        try {
          const { data, error } = await supabase
            .from("comments")
            .select("*, user:profiles(avatar_url, username)")
            .eq("post_id", postId)
            .order("created_at", { ascending: true })

          if (error) {
            throw error
          }

          const mappedComments = await Promise.all(
            (data ?? []).map((commentRow) => mapCommentRowToComment(supabase, commentRow as RealtimeRow, usernameCacheRef.current)),
          )

          setCommentsByPostId((prevCommentsByPostId) => ({
            ...prevCommentsByPostId,
            [postId]: sortCommentsByCreatedAt(mappedComments),
          }))

          loadedCommentPostIdsRef.current.add(postId)
        } catch (error) {
          console.error("[AchievementFeed] Failed to fetch comments:", error)
        } finally {
          setLoadingCommentPostIds((prevLoadingCommentPostIds) => {
            const nextLoadingCommentPostIds = new Set(prevLoadingCommentPostIds)
            nextLoadingCommentPostIds.delete(postId)
            return nextLoadingCommentPostIds
          })
        }
      }

      attachCommentRealtimeForPost(postId)
    },
    [attachCommentRealtimeForPost],
  )

  const closeCommentsForPost = useCallback((postId: string) => {
    const supabase = getSupabaseBrowserClient()

    setOpenCommentPostIds((prevOpenCommentPostIds) => {
      const nextOpenCommentPostIds = new Set(prevOpenCommentPostIds)
      nextOpenCommentPostIds.delete(postId)
      return nextOpenCommentPostIds
    })

    const existingChannel = commentChannelsRef.current[postId]

    if (supabase && existingChannel) {
      void supabase.removeChannel(existingChannel)
    }

    delete commentChannelsRef.current[postId]
  }, [])

  const handleToggleComments = useCallback(
    (postId: string) => {
      if (openCommentPostIds.has(postId)) {
        closeCommentsForPost(postId)
        return
      }

      void openCommentsForPost(postId)
    },
    [closeCommentsForPost, openCommentsForPost, openCommentPostIds],
  )

  const handleSendComment = useCallback(
    async (postId: string) => {
      const supabase = getSupabaseBrowserClient()

      if (!supabase || !postId || pendingCommentPostIds.has(postId)) {
        return
      }

      const content = (commentDraftByPostId[postId] ?? "").trim()

      if (!content) {
        return
      }

      const sessionResult = await supabase.auth.getSession()
      const userId = sessionResult.data.session?.user?.id ?? currentUserIdRef.current

      if (!userId) {
        window.alert("Please log in to comment")
        return
      }

      const tempId = `temp-comment-${postId}-${Date.now()}`
      const optimisticComment: PostComment = {
        id: tempId,
        postId,
        userId,
        author: usernameCacheRef.current[userId] || "You",
        content,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      }

      setPendingCommentPostIds((prevPendingCommentPostIds) => {
        const nextPendingCommentPostIds = new Set(prevPendingCommentPostIds)
        nextPendingCommentPostIds.add(postId)
        return nextPendingCommentPostIds
      })

      setCommentDraftByPostId((prevCommentDraftByPostId) => ({
        ...prevCommentDraftByPostId,
        [postId]: "",
      }))

      setCommentsByPostId((prevCommentsByPostId) => {
        const existing = prevCommentsByPostId[postId] ?? []
        return {
          ...prevCommentsByPostId,
          [postId]: upsertCommentList(existing, optimisticComment),
        }
      })

      try {
        const insertResult = await supabase
          .from("comments")
          .insert({
            post_id: postId,
            user_id: userId,
            content,
          })
          .select("*")
          .single()

        if (insertResult.error) {
          throw insertResult.error
        }

        const mappedComment = await mapCommentRowToComment(
          supabase,
          (insertResult.data as RealtimeRow | null) ?? {},
          usernameCacheRef.current,
        )

        setCommentsByPostId((prevCommentsByPostId) => {
          const existing = prevCommentsByPostId[postId] ?? []

          return {
            ...prevCommentsByPostId,
            [postId]: upsertCommentList(existing, mappedComment, tempId),
          }
        })
      } catch (error) {
        console.error("[AchievementFeed] Failed to create comment:", error)

        setCommentsByPostId((prevCommentsByPostId) => {
          const existing = prevCommentsByPostId[postId] ?? []
          return {
            ...prevCommentsByPostId,
            [postId]: existing.filter((comment) => comment.id !== tempId),
          }
        })

        setCommentDraftByPostId((prevCommentDraftByPostId) => ({
          ...prevCommentDraftByPostId,
          [postId]: content,
        }))
      } finally {
        setPendingCommentPostIds((prevPendingCommentPostIds) => {
          const nextPendingCommentPostIds = new Set(prevPendingCommentPostIds)
          nextPendingCommentPostIds.delete(postId)
          return nextPendingCommentPostIds
        })
      }
    },
    [commentDraftByPostId, pendingCommentPostIds],
  )

  const handleCopyPostLink = useCallback(async (postId: string) => {
    if (!postId) {
      return
    }

    const postUrl = `${window.location.origin}/community/feed?postId=${encodeURIComponent(postId)}`

    try {
      await navigator.clipboard.writeText(postUrl)
      toast.success("Post link copied to clipboard!")
    } catch {
      toast.error("Unable to copy link. Please try again.")
    }
  }, [])

  const handleShareToWhatsApp = useCallback((postId: string) => {
    if (!postId) {
      return
    }

    const postUrl = `${window.location.origin}/community/feed?postId=${encodeURIComponent(postId)}`
    const text = `Check out this post: ${postUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`

    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }, [])

  useEffect(() => {
    if (!forceOpenCommentPostId) {
      return
    }

    if (!posts.some((post) => post.id === forceOpenCommentPostId)) {
      return
    }

    if (!openCommentPostIds.has(forceOpenCommentPostId)) {
      void openCommentsForPost(forceOpenCommentPostId)
    }

    onForceOpenCommentPostHandled?.()
  }, [forceOpenCommentPostId, onForceOpenCommentPostHandled, openCommentPostIds, openCommentsForPost, posts])

  useEffect(() => {
    if (!onLoadMorePosts || !hasMorePosts || !loadMoreSentinelRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]

        if (firstEntry?.isIntersecting && !isLoadingMorePosts) {
          onLoadMorePosts()
        }
      },
      {
        root: null,
        rootMargin: "0px 0px 280px 0px",
        threshold: 0.1,
      },
    )

    observer.observe(loadMoreSentinelRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMorePosts, isLoadingMorePosts, onLoadMorePosts])

  return (
    <section className="space-y-4">
      {posts.map((post) => {
        const isLiked = Boolean(likedPostIds?.has(post.id))
        const isHighlighted = highlightedPostId === post.id
        const commentsForPost = commentsByPostId[post.id] ?? []
        const isCommentsOpen = openCommentPostIds.has(post.id)
        const isCommentsLoading = loadingCommentPostIds.has(post.id)
        const isCommentSending = pendingCommentPostIds.has(post.id)
        const commentDraft = commentDraftByPostId[post.id] ?? ""
        const commentCount = loadedCommentPostIdsRef.current.has(post.id) ? commentsForPost.length : post.comments

        return (
          <article
            id={post.id}
            key={post.id}
            className={`glass-card-3d rounded-2xl p-5 sm:p-6 ${
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
                <p className="glass-title-gold font-display text-xl font-semibold">{post.author}</p>
                <p className="font-sans text-xs text-[#8d9fa3]">{post.postedAt}</p>
              </div>
            </div>

            {post.content ? <p className="glass-body-offwhite mt-4 font-sans text-base leading-relaxed">{post.content}</p> : null}

            {post.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-[#7a6222]/45 bg-black/35 p-1 shadow-[inset_0_0_24px_rgba(255,215,0,0.16)]">
                <div className="h-[300px] overflow-hidden rounded-lg bg-[#081116]">
                  <img
                    src={post.imageUrl}
                    alt="Post upload"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-4 text-[#8d9fa3]">
              <button
                type="button"
                onClick={() => onLike?.(post.id)}
                disabled={!onLike || pendingLikePostIds?.has(post.id)}
                className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[#ff620f] disabled:cursor-not-allowed disabled:opacity-70"
                aria-label={isLiked ? "Unlike post" : "Like post"}
              >
                <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : "text-gray-400"} />
                {post.likes}
              </button>
              <button
                type="button"
                onClick={() => handleToggleComments(post.id)}
                className="inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[#ff620f]"
                aria-expanded={isCommentsOpen}
                aria-controls={`comments-${post.id}`}
                aria-label="Toggle comments"
              >
                <MessageSquare size={18} />
                {commentCount}
              </button>
              <button
                type="button"
                onClick={() => handleCopyPostLink(post.id)}
                className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:text-[#ff620f]"
                aria-label="Copy post link"
              >
                <Send size={18} />
              </button>
              <button
                type="button"
                onClick={() => handleShareToWhatsApp(post.id)}
                className="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:text-[#25d366]"
                aria-label="Share to WhatsApp"
              >
                <MessageCircle size={18} />
              </button>
            </div>

            {isCommentsOpen ? (
              <div id={`comments-${post.id}`} className="mt-4 rounded-xl border border-[#153239] bg-[#05171c] p-3 sm:p-4">
                {isCommentsLoading ? (
                  <p className="font-sans text-xs text-[#8d9fa3]">Loading comments...</p>
                ) : commentsForPost.length === 0 ? (
                  <p className="font-sans text-xs text-[#8d9fa3]">No comments yet. Start the conversation.</p>
                ) : (
                  <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                    {commentsForPost.map((comment) => {
                      const relativeTime = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                      return (
                        <div key={comment.id} className="flex gap-2 rounded-lg border border-[#183842] bg-[#082028] p-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {comment.avatarUrl ? (
                              <AvatarPrimitive.Root className="h-8 w-8 overflow-hidden rounded-full border border-[#1d4f5b]">
                                <AvatarPrimitive.Image src={comment.avatarUrl} alt={comment.author} className="h-full w-full object-cover" />
                                <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center bg-[#0f2a31] text-xs font-bold text-[#ff620f]">
                                  {comment.author.charAt(0).toUpperCase()}
                                </AvatarPrimitive.Fallback>
                              </AvatarPrimitive.Root>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1d4f5b] bg-[#0f2a31] text-xs font-bold text-[#ff620f]">
                                {comment.author.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <p className="font-sans text-xs font-semibold text-[#dce7ea]">{comment.author}</p>
                              <p className="font-sans text-xs text-[#8d9fa3]">{relativeTime}</p>
                            </div>
                            <p className="mt-1 font-sans text-sm text-[#c6d6da] break-words">{comment.content}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={commentDraft}
                    onChange={(event) => {
                      const value = event.target.value
                      setCommentDraftByPostId((prevCommentDraftByPostId) => ({
                        ...prevCommentDraftByPostId,
                        [post.id]: value,
                      }))
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        void handleSendComment(post.id)
                      }
                    }}
                    placeholder="Write a comment..."
                    className="h-10 w-full rounded-lg border border-[#1b3f49] bg-[#0a2027] px-3 font-sans text-sm text-[#e4edf0] outline-none transition-colors placeholder:text-[#7f959d] focus:border-[#ff620f]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleSendComment(post.id)
                    }}
                    disabled={isCommentSending || !commentDraft.trim()}
                    className="inline-flex h-10 min-w-20 items-center justify-center gap-1 rounded-lg border border-[#2a4b53] bg-[#0d2a31] px-3 font-sans text-sm text-[#e4edf0] transition-colors hover:border-[#ff620f] hover:text-[#ffb170] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SendHorizontal size={14} />
                    Send
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        )
      })}

      {onLoadMorePosts ? (
        <div className="pb-2">
          {isLoadingMorePosts ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1c2f33] bg-[#041419]/75 px-4 py-3">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#325962] border-t-[#ff620f]" />
              <p className="font-sans text-sm text-[#8d9fa3]">Loading more posts...</p>
            </div>
          ) : null}

          {!hasMorePosts && showEndOfFeedMessage ? (
            <p className="text-center font-sans text-sm text-[#8d9fa3]">You've reached the end of the feed.</p>
          ) : null}

          {hasMorePosts ? <div ref={loadMoreSentinelRef} className="h-2" aria-hidden="true" /> : null}
        </div>
      ) : null}
    </section>
  )
}
