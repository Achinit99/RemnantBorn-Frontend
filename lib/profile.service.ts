/**
 * What: Profile service layer for fetching profile data and mapping DTOs into UI shape.
 * Why: Separates API payload quirks from page/component rendering logic.
 */
import { authApi } from "@/lib/auth-api"
import { getStoredAccessToken } from "@/lib/auth"
import type { PlayerProfile } from "@/components/community/types"

export interface ProfileResponseDto {
  username: string
  email: string
  level: number
  rank?: string | null
  remnantCount: number
  bio: string
  avatarUrl: string | null
}

interface UserProfileEnvelope {
  data?: ProfileResponseDto
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsedValue = Number(value)

    if (Number.isFinite(parsedValue)) {
      return parsedValue
    }
  }

  return 0
}

function normalizeText(value: unknown, fallbackValue: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim()
  }

  return fallbackValue
}

function extractUserProfile(payload: ProfileResponseDto | UserProfileEnvelope): ProfileResponseDto {
  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data
  }

  return payload as ProfileResponseDto
}

export function mapProfileResponseToPlayerProfile(profile: ProfileResponseDto): PlayerProfile {
  // Central profile normalizer so UI always gets predictable fallback-safe values.
  return {
    username: normalizeText(profile.username, "Unknown Player"),
    email: normalizeText(profile.email, "No email provided"),
    level: toNumber(profile.level),
    rank: normalizeText(profile.rank, "Unranked"),
    remnantCount: toNumber(profile.remnantCount),
    bio: normalizeText(profile.bio, "No bio available yet."),
    avatarUrl: typeof profile.avatarUrl === "string" && profile.avatarUrl.trim().length > 0 ? profile.avatarUrl : null,
  }
}

export async function getUserProfile(): Promise<ProfileResponseDto> {
  // Token-aware profile fetch used by dashboard/profile pages.
  const accessToken = getStoredAccessToken()

  if (!accessToken) {
    throw new Error("Missing access token")
  }

  const response = await authApi.get<ProfileResponseDto | UserProfileEnvelope>("/auth/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  return extractUserProfile(response.data)
}