/**
 * What: Shared API URL resolver for browser and server-side HTTP clients.
 * Why: Keeps backend host configuration in one place and makes environment overrides predictable.
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "/api"
}
