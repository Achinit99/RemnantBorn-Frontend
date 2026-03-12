import axios from "axios"

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")

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

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
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
