/**
 * What: Shared API URL resolver for browser and server-side HTTP clients.
 * Why: Keeps backend host configuration in one place and makes environment overrides predictable.
 */
export function getApiBaseUrl(): string {
  return "http://163.47.8.39"
}
