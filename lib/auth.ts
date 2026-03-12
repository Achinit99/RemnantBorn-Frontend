export const AUTH_COOKIE_CANDIDATES = [
  "rb_access_token",
  "access_token",
  "auth_token",
  "token",
  "session",
] as const

export const DEV_AUTH_COOKIE_NAME = "rb_access_token"
export const DEV_AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12
export const DEFAULT_AUTH_REDIRECT_PATH = "/community"

interface CookieStoreLike {
  get: (name: string) => { value: string } | undefined
}

export function hasAuthCookie(cookieStore: CookieStoreLike): boolean {
  return AUTH_COOKIE_CANDIDATES.some((cookieName) => {
    const cookieValue = cookieStore.get(cookieName)?.value
    return Boolean(cookieValue)
  })
}

export function buildLoginRedirectPath(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath)}`
}

export function sanitizeNextPath(nextPath: string | null | undefined): string {
  if (!nextPath) {
    return DEFAULT_AUTH_REDIRECT_PATH
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH
  }

  return nextPath
}

export function createDevAuthToken(): string {
  return `dev-session-${Date.now()}`
}

export function createDevAuthCookieString(
  token: string,
  maxAgeSeconds: number = DEV_AUTH_COOKIE_MAX_AGE_SECONDS,
): string {
  return `${DEV_AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
}

export function clearAuthCookie(cookieName: string = DEV_AUTH_COOKIE_NAME): string {
  return `${cookieName}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}
