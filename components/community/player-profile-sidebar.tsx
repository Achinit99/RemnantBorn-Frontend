/**
 * What: Profile sidebar card for avatar, stats, and short bio presentation.
 * Why: Reuses a single profile layout in dashboard and profile detail views.
 */
import { Pencil } from "lucide-react"

import type { PlayerProfile } from "@/components/community/types"

const DEFAULT_GAMING_AVATAR_URL = "/images/default-gaming-avatar.svg"

interface PlayerProfileSidebarProps {
  profile: PlayerProfile
}

export function PlayerProfileSidebar({ profile }: PlayerProfileSidebarProps) {
  const avatarUrl = profile.avatarUrl || DEFAULT_GAMING_AVATAR_URL

  return (
    <aside className="glass-card-3d rounded-2xl p-5 sm:p-6">
      <h2 className="glass-title-gold font-sans text-xl tracking-[0.08em]">Player Profile</h2>

      <div className="mt-6 text-center">
        <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-[#ff620f] bg-[#071f23] p-1">
          <img src={avatarUrl} alt={profile.username} className="h-full w-full rounded-full object-cover" />
        </div>
        <p className="mt-4 font-display text-3xl font-bold text-amber-300">{profile.username}</p>
        <p className="mt-2 break-all font-sans text-sm text-[#8d9fa3]">{profile.email}</p>
        <p className="font-sans text-sm text-[#8d9fa3]">Level {profile.level}</p>
        <p className="mt-1 font-sans text-xs tracking-[0.12em] text-[#ff8b4f] uppercase">{profile.rank}</p>
      </div>

      <div className="mt-6 rounded-xl border border-[#122328] bg-black/40 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="font-sans text-[#8d9fa3]">Remnants</span>
          <span className="font-sans font-semibold text-[#ff620f]">{profile.remnantCount.toLocaleString()}</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-sans text-[#8d9fa3]">Email</span>
          <span className="ml-4 break-all text-right font-sans font-semibold text-[#ff620f]">{profile.email}</span>
        </div>
      </div>

      <div className="mt-6">
        <p className="font-sans text-sm text-[#8d9fa3]">Bio</p>
        <div className="mt-3 rounded-xl border border-[#122328] bg-black/40 p-4 backdrop-blur-xl">
          <p className="glass-body-offwhite font-sans text-sm leading-relaxed">{profile.bio}</p>
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
