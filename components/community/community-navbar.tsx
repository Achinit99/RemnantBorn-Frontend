"use client"

import { CircleUserRound, LogOut, Menu, ShieldCheck, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import type { NavLink } from "@/components/community/types"
import { AUTH_COOKIE_CANDIDATES, clearAuthCookie } from "@/lib/auth"

interface CommunityNavbarProps {
  links: NavLink[]
}

export function CommunityNavbar({ links }: CommunityNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActivePath = (href: string) => {
    if (href === "/community") {
      return pathname === "/community"
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = () => {
    AUTH_COOKIE_CANDIDATES.forEach((cookieName) => {
      document.cookie = clearAuthCookie(cookieName)
    })

    router.push("/login")
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
