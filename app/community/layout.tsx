/**
 * What: Shared layout for all community pages with auth guard and navigation shell.
 * Why: Protects private routes and keeps the community visual frame consistent.
 */
"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { communityNavLinks } from "@/app/community/mock-data"
import { CommunityBackgroundVideo } from "@/components/community/community-background-video"
import { CommunityNavbar } from "@/components/community/community-navbar"
import { CommunityNotificationProvider } from "@/components/community/community-notification-provider"
import { AUTH_COOKIE_CANDIDATES, buildLoginRedirectPath } from "@/lib/auth"

function hasAuthCookieFromDocumentCookie(cookieString: string): boolean {
  if (!cookieString) {
    return false
  }

  const cookiePairs = cookieString.split(";").map((entry) => entry.trim())
  const cookieNames = new Set(cookiePairs.map((entry) => entry.split("=")[0]))

  return AUTH_COOKIE_CANDIDATES.some((cookieName) => cookieNames.has(cookieName))
}

export default function CommunityLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const router = useRouter()
  const loginRedirectPath = useMemo(() => buildLoginRedirectPath(pathname || "/community"), [pathname])
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authenticated = hasAuthCookieFromDocumentCookie(document.cookie)

    setIsAuthenticated(authenticated)
    setIsCheckingAuth(false)

    if (!authenticated) {
      router.replace(loginRedirectPath)
    }
  }, [loginRedirectPath, router])

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#031014] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1c2f33] border-t-[#ff620f]" aria-label="Checking session" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="relative isolate min-h-screen bg-transparent text-white">
      <CommunityBackgroundVideo />
      <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/70 via-yellow-900/30 to-black/80 backdrop-blur-md" />
      <div className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(56%_70%_at_78%_12%,rgba(160,102,47,0.16)_0%,rgba(2,11,13,0)_70%)]" />

      <CommunityNotificationProvider>
        <div className="relative z-20">
          <CommunityNavbar links={communityNavLinks} />
          <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
        </div>
      </CommunityNotificationProvider>
    </div>
  )
}
