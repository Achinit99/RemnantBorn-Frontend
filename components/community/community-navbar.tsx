/**
 * What: Sticky community navigation bar with active-route highlighting and logout action.
 * Why: Keeps route switching and session exit controls consistent across community pages.
 */
"use client"

import { Bell, CircleUserRound, LogOut, Menu, ShieldCheck, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useCommunityNotifications } from "@/components/community/community-notification-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { NavLink } from "@/components/community/types"
import { clearClientAuthSession } from "@/lib/auth"

interface CommunityNavbarProps {
  links: NavLink[]
}

export function CommunityNavbar({ links }: CommunityNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useCommunityNotifications()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Active-link helper for desktop and mobile nav states.
  const isActivePath = (href: string) => {
    if (href === "/community") {
      return pathname === "/community"
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  // Simple logout path: clear local auth footprint, then push user to login.
  const handleLogout = () => {
    clearClientAuthSession()
    router.push("/login")
  }

  const handleNotificationClick = (notificationId: string, postId: string, openComments: boolean) => {
    setIsNotificationsOpen(false)
    markAsRead(notificationId)

    if (!postId) {
      return
    }

    const postIdQuery = `postId=${encodeURIComponent(postId)}`
    const targetRoute = openComments
      ? `/community/feed?${postIdQuery}&openComments=1`
      : `/community/feed?${postIdQuery}`

    // Smart deep-link: jump to full feed when needed, or refresh feed query when already there.
    if (pathname !== "/community/feed") {
      router.push(targetRoute)
      return
    }

    router.replace(targetRoute)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#1c2f33]/80 bg-[#031014]/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/community" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff620f] font-display text-sm font-bold text-[#ff620f]">
            R
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold tracking-wide text-[#ff620f]">REMNANTBORN</p>
            <p className="font-sans text-xs tracking-[0.18em] text-[#8d9fa3] uppercase">Community Hub</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`font-sans text-sm tracking-[0.08em] transition-colors hover:text-[#FF6B00] ${
                isActivePath(link.href) ? "text-[#FF6B00]" : "text-[#8d9fa3]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isMounted ? (
            <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1c2f33] bg-[#05171b] text-[#8d9fa3] transition-colors hover:border-[#ff620f] hover:text-[#ff620f]"
                  aria-label="Open notifications"
                >
                  <Bell size={17} />
                  {unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-[#521717] bg-[#e5484d] px-1 font-sans text-[10px] leading-none font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[340px] rounded-xl border border-[#1c2f33] bg-[#041419]/95 p-0 text-[#d8e4e7] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)] backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-[#1c2f33] px-4 py-3">
                  <h3 className="font-display text-sm font-bold tracking-wide text-[#e6edf0]">Notifications</h3>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="font-sans text-xs text-[#8d9fa3] transition-colors hover:text-[#ff620f]"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#1c2f33] px-3 py-4 text-center font-sans text-xs text-[#8d9fa3]">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 12).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification.id, notification.postId, Boolean(notification.openComments))}
                        className={`mb-1 flex w-full flex-col rounded-lg border px-3 py-2 text-left transition-colors last:mb-0 ${
                          notification.isRead
                            ? "border-[#173036] bg-[#06181d] hover:bg-[#0a232a]"
                            : "border-[#2a4348] bg-[#0a2026] hover:bg-[#0d2830]"
                        }`}
                      >
                        <span className="font-sans text-sm text-[#e6edf0]">{notification.message}</span>
                        <span className="mt-1 font-sans text-[11px] text-[#8d9fa3]">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1c2f33] bg-[#05171b] text-[#8d9fa3]">
              <Bell size={17} />
            </span>
          )}

          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1c2f33] bg-[#05171b] text-[#8d9fa3]">
            <CircleUserRound size={18} />
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#1c2f33] bg-[#05171b] text-[#8d9fa3] transition-colors hover:border-[#ff620f] hover:text-[#ff620f]"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#1c2f33] bg-[#05171b] text-[#8d9fa3] lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#1c2f33] bg-[#031014] px-4 py-4 lg:hidden sm:px-6">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-sans text-sm tracking-[0.08em] transition-colors hover:text-[#FF6B00] ${
                  isActivePath(link.href) ? "text-[#FF6B00]" : "text-[#8d9fa3]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[#1c2f33] bg-[#05171b] px-3 py-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#ff620f]" />
              <span className="font-sans text-xs text-[#8d9fa3]">Authenticated Session</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#1c2f33] text-[#8d9fa3] transition-colors hover:border-[#ff620f] hover:text-[#ff620f]"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
