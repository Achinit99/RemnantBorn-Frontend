/**
 * What: Shared TypeScript contracts for community pages and components.
 * Why: Keeps data shapes consistent across UI and service mapping logic.
 */
export interface NavLink {
  label: string
  href: string
}

export interface PlayerStat {
  label: string
  value: string
}

export interface PlayerProfile {
  username: string
  email: string
  level: number
  rank: string
  avatarUrl: string | null
  remnantCount: number
  bio: string
}

export interface Bounty {
  id: string
  title: string
  reward: string
  difficulty: "Easy" | "Medium" | "Hard"
}

export interface AchievementPost {
  id: string
  author: string
  avatarUrl: string
  postedAt: string
  content: string
  likes: number
  comments: number
  shares: number
}

export interface PostComment {
  id: string
  postId: string
  userId: string
  author: string
  content: string
  createdAt: string
  avatarUrl?: string | null
  isOptimistic?: boolean
}

export interface ChatMessage {
  id: string
  author: string
  content: string
  postedAt: string
}

export interface DailyRelic {
  title: string
  status: string
  claimedToday: boolean
}
