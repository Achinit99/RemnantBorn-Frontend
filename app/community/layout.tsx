/**
 * What: Shared layout for all community pages with auth guard and navigation shell.
 * Why: Protects private routes and keeps the community visual frame consistent.
 */
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { communityNavLinks } from "@/app/community/mock-data"
import { CommunityBackgroundVideo } from "@/components/community/community-background-video"
import { CommunityNavbar } from "@/components/community/community-navbar"
import { CommunityNotificationProvider } from "@/components/community/community-notification-provider"
import { buildLoginRedirectPath, hasAuthCookie } from "@/lib/auth"

export default async function CommunityLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side auth gate before rendering any community content.
  const cookieStore = await cookies()
  const isAuthenticated = hasAuthCookie(cookieStore)

  if (!isAuthenticated) {
    redirect(buildLoginRedirectPath("/community"))
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
