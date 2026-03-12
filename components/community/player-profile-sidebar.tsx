import { Pencil, Trophy } from "lucide-react"

import type { PlayerProfile } from "@/components/community/types"

interface PlayerProfileSidebarProps {
  profile: PlayerProfile
}

export function PlayerProfileSidebar({ profile }: PlayerProfileSidebarProps) {
  return (
    <aside className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.85)] sm:p-6">
      <h2 className="font-sans text-xl tracking-[0.08em] text-[#ff620f]">Player Profile</h2>

      <div className="mt-6 text-center">
        <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-[#ff620f] bg-[#071f23] p-1">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0f2a31] font-display text-2xl font-bold text-[#ff620f]">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <p className="mt-4 font-display text-3xl font-bold text-[#e6edf0]">{profile.username}</p>
        <p className="font-sans text-sm text-[#8d9fa3]">Level {profile.level}</p>
      </div>

      <div className="mt-6 rounded-xl border border-[#122328] bg-[#06181d] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-sans text-[#8d9fa3]">{profile.experienceLabel}</span>
          <span className="font-sans font-semibold text-[#ff620f]">{profile.stats[0]?.value}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#122328]">
          <div
            className="h-full rounded-full bg-[#ff620f]"
            style={{ width: `${Math.max(0, Math.min(profile.experienceValue, 100))}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-sans text-[#8d9fa3]">Gold</span>
          <span className="font-sans font-semibold text-[#ff620f]">{profile.gold}</span>
        </div>
      </div>

      <div className="mt-6">
        <p className="font-sans text-sm text-[#8d9fa3]">Achievements</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.achievements.map((achievement) => (
            <span
              key={achievement}
              className="inline-flex items-center gap-1 rounded-full border border-[#673419] bg-[#2a170d] px-3 py-1 font-sans text-xs text-[#ff8b4f]"
            >
              <Trophy size={12} />
              {achievement}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff620f] px-4 py-3 font-sans text-sm font-semibold text-black transition-colors hover:bg-[#ff7b36]"
      >
        <Pencil size={16} />
        Edit Profile
      </button>
    </aside>
  )
}
