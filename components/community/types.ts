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
  level: number
  avatarUrl: string
  experienceLabel: string
  experienceValue: number
  gold: string
  achievements: string[]
  stats: PlayerStat[]
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
