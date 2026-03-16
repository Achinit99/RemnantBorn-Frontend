"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { dailyRelic } from "@/app/community/mock-data"
import { DailyRelicStatus } from "@/components/community/daily-relic-status"
import type { PlayerProfile } from "@/components/community/types"
import { PlayerProfileSidebar } from "@/components/community/player-profile-sidebar"
import { getApiErrorMessage } from "@/lib/auth-api"
import { clearClientAuthSession, getStoredAccessToken } from "@/lib/auth"
import { getUserProfile, mapProfileResponseToPlayerProfile } from "@/lib/profile.service"

function ProfileLoadingState() {
  return (
    <div className="space-y-4">
      <header>
        <div className="h-10 w-40 animate-pulse rounded-lg bg-[#0d2328]" />
        <div className="mt-2 h-5 w-72 animate-pulse rounded-lg bg-[#0b1d21]" />
      </header>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,420px)]">
        <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.85)] sm:p-6">
          <div className="mx-auto h-24 w-24 animate-pulse rounded-full border-2 border-[#1c2f33] bg-[#0d2328]" />
          <div className="mx-auto mt-4 h-8 w-48 animate-pulse rounded-lg bg-[#0d2328]" />
          <div className="mx-auto mt-2 h-4 w-56 animate-pulse rounded-lg bg-[#0b1d21]" />
          <div className="mx-auto mt-2 h-4 w-20 animate-pulse rounded-lg bg-[#0b1d21]" />
          <div className="mt-6 h-24 animate-pulse rounded-xl border border-[#122328] bg-[#06181d]" />
          <div className="mt-6 h-28 animate-pulse rounded-xl border border-[#122328] bg-[#06181d]" />
          <div className="mt-6 h-12 animate-pulse rounded-xl bg-[#0d2328]" />
        </section>
        <section className="rounded-2xl border border-[#1c2f33] bg-[#041419]/85 p-5 sm:p-6">
          <div className="mx-auto h-28 w-28 animate-pulse rounded-full border-4 border-[#1c2f33] bg-[#0d2328]" />
          <div className="mx-auto mt-4 h-8 w-40 animate-pulse rounded-lg bg-[#0d2328]" />
          <div className="mx-auto mt-2 h-4 w-24 animate-pulse rounded-lg bg-[#0b1d21]" />
          <div className="mt-4 h-12 animate-pulse rounded-xl bg-[#0d2328]" />
        </section>
      </div>
    </div>
  )
}

export default function CommunityProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      router.replace("/login")

      return () => {
        isMounted = false
      }
    }

    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile()

        if (!isMounted) {
          return
        }

        setProfile(mapProfileResponseToPlayerProfile(userProfile))
        setErrorMessage("")
      } catch (error) {
        if (!isMounted) {
          return
        }

        if (error instanceof Error && error.message === "Missing access token") {
          clearClientAuthSession()
          router.replace("/login")
          return
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearClientAuthSession()
          router.replace("/login")
          return
        }

        setErrorMessage(getApiErrorMessage(error, "Unable to load your profile right now."))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchProfile()

    return () => {
      isMounted = false
    }
  }, [router])

  if (isLoading) {
    return <ProfileLoadingState />
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Profile</h1>
          <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">Your profile could not be loaded.</p>
        </header>
        {errorMessage && (
          <div className="rounded-2xl border border-[#673419] bg-[#2a170d] px-5 py-4 font-sans text-sm text-[#ffb286]">
            {errorMessage}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-bold text-[#e6edf0] sm:text-4xl">Profile</h1>
        <p className="mt-2 font-sans text-sm text-[#8d9fa3] sm:text-base">Player profile details from your account.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,420px)]">
        <PlayerProfileSidebar profile={profile} />
        <DailyRelicStatus relic={dailyRelic} />
      </div>
    </div>
  )
}
