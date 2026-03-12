import type {
  AchievementPost,
  Bounty,
  ChatMessage,
  DailyRelic,
  NavLink,
  PlayerProfile,
} from "@/components/community/types"

export const communityNavLinks: NavLink[] = [
  { label: "Home", href: "/community" },
  { label: "Bounties", href: "/community/bounties" },
  { label: "Social Feed", href: "/community/feed" },
  { label: "Live Chat", href: "/community/chat" },
  { label: "Profile", href: "/community/profile" },
]

export const playerProfile: PlayerProfile = {
  username: "Legendary Hero",
  level: 99,
  avatarUrl: "",
  experienceLabel: "Experience",
  experienceValue: 78,
  gold: "50,000 G",
  achievements: ["Dragon Slayer", "Collector", "Adventurer"],
  stats: [
    { label: "Experience", value: "1,234,456 XP" },
    { label: "Gold", value: "50,000 G" },
  ],
}

export const bounties: Bounty[] = [
  { id: "b1", title: "Slay Forest Creatures", reward: "500 Gold", difficulty: "Easy" },
  { id: "b2", title: "Collect Ancient Artifacts", reward: "1000 Gold", difficulty: "Medium" },
  { id: "b3", title: "Defeat Dark Lord", reward: "5000 Gold", difficulty: "Hard" },
  { id: "b4", title: "Escort Merchant Caravan", reward: "750 Gold", difficulty: "Easy" },
  { id: "b5", title: "Seal Rift Nexus", reward: "2500 Gold", difficulty: "Medium" },
]

export const achievementPosts: AchievementPost[] = [
  {
    id: "p1",
    author: "Flashboder",
    avatarUrl: "",
    postedAt: "2h ago",
    content: "Just defeated the Ancient Dragon! Epic battle!",
    likes: 245,
    comments: 32,
    shares: 12,
  },
  {
    id: "p2",
    author: "Plashsheboder",
    avatarUrl: "",
    postedAt: "4h ago",
    content: "New raid strategy guide available! Check it out for better loot!",
    likes: 512,
    comments: 78,
    shares: 45,
  },
  {
    id: "p3",
    author: "Neralis",
    avatarUrl: "",
    postedAt: "6h ago",
    content: "Guild run complete. We cleared all towers with zero wipes!",
    likes: 189,
    comments: 22,
    shares: 9,
  },
  {
    id: "p4",
    author: "Cinderwolf",
    avatarUrl: "",
    postedAt: "9h ago",
    content: "Crafting tip: stack ember shards before forging relic gear.",
    likes: 301,
    comments: 41,
    shares: 17,
  },
]

export const liveChatMessages: ChatMessage[] = [
  {
    id: "c1",
    author: "Flashboder",
    content: "Anyone up for dungeon run?",
    postedAt: "5m ago",
  },
  {
    id: "c2",
    author: "Plashsheboder",
    content: "Count me in! Need 2 more players",
    postedAt: "3m ago",
  },
  {
    id: "c3",
    author: "Liager_tatic",
    content: "I am ready to go!",
    postedAt: "1m ago",
  },
  {
    id: "c4",
    author: "MiraShade",
    content: "Need healer for abyss gate, anyone available?",
    postedAt: "Just now",
  },
]

export const dailyRelic: DailyRelic = {
  title: "Daily Relic",
  status: "Claimed Today",
  claimedToday: true,
}

export const signedInEmail = "achinikawshalya720@gmail.com"
