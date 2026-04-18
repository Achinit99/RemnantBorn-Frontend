/**
 * What: Axios auth client and error message normalizer for backend calls.
 * Why: Gives pages/services one clean place for auth API config and user-friendly errors.
 */
import axios from "axios"
import { getApiBaseUrl } from "@/lib/api-config"

const apiBaseUrl = getApiBaseUrl()

export const authApi = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
})

type ApiErrorPayload = {
  message?: string | string[]
  error?: string
}

type AuthTokenPayload = {
  access_token?: unknown
  accessToken?: unknown
  refresh_token?: unknown
  refreshToken?: unknown
  data?: unknown
  tokens?: unknown
}

function readToken(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
}

function resolveAuthPayload(payload: unknown): AuthTokenPayload | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  return payload as AuthTokenPayload
}

export function extractAuthTokens(payload: unknown): { accessToken: string | null; refreshToken: string | null } {
  const normalizedPayload = resolveAuthPayload(payload)

  if (!normalizedPayload) {
    return { accessToken: null, refreshToken: null }
  }

  const nestedPayload = resolveAuthPayload(normalizedPayload.data) ?? resolveAuthPayload(normalizedPayload.tokens)

  const accessToken = readToken(normalizedPayload.access_token) ?? readToken(normalizedPayload.accessToken) ?? readToken(nestedPayload?.access_token) ?? readToken(nestedPayload?.accessToken)
  const refreshToken = readToken(normalizedPayload.refresh_token) ?? readToken(normalizedPayload.refreshToken) ?? readToken(nestedPayload?.refresh_token) ?? readToken(nestedPayload?.refreshToken)

  return { accessToken, refreshToken }
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  // Friendly error extraction chain: API payload first, runtime error next, fallback last.
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const message = error.response?.data?.message

    if (Array.isArray(message) && message.length > 0) {
      return message.join(" ")
    }

    if (typeof message === "string" && message.trim().length > 0) {
      return message
    }

    if (typeof error.response?.data?.error === "string" && error.response.data.error.trim().length > 0) {
      return error.response.data.error
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}
