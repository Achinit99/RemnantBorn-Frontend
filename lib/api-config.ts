/**
 * What: Shared API URL resolver for browser and server-side HTTP clients.
 * Why: Keeps backend host configuration in one place and makes environment overrides predictable.
 */
export function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
  return apiUrl.replace(/\/$/, "")
}
