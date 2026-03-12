import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { communityNavLinks } from "@/app/community/mock-data"
import { CommunityNavbar } from "@/components/community/community-navbar"
import { buildLoginRedirectPath, hasAuthCookie } from "@/lib/auth"

export default async function CommunityLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const isAuthenticated = hasAuthCookie(cookieStore)

  if (!isAuthenticated) {
    redirect(buildLoginRedirectPath("/community"))
  }

  return (
    <div className="min-h-screen bg-[#020b0d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(56%_70%_at_78%_12%,rgba(160,102,47,0.16)_0%,rgba(2,11,13,0)_70%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(5,16,20,0.93)_0%,rgba(2,11,13,0.97)_45%,rgba(1,7,9,1)_100%)]" />

      <div className="relative z-10">
        <CommunityNavbar links={communityNavLinks} />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
