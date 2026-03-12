"use client"

import { Menu, User, X } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import {
  createDevAuthCookieString,
  createDevAuthToken,
  sanitizeNextPath,
} from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextPath = sanitizeNextPath(searchParams.get("next"))

    if (process.env.NODE_ENV !== "production") {
      const devCookie = createDevAuthCookieString(createDevAuthToken())
      document.cookie = devCookie
    }

    router.push(nextPath)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020b0d] text-white">
      <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[radial-gradient(45%_65%_at_75%_62%,rgba(161,151,84,0.38)_0%,rgba(24,43,35,0.12)_46%,rgba(2,10,13,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,17,0.78)_0%,rgba(1,10,12,0.93)_48%,rgba(2,10,12,0.96)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col pt-16">
        <header className="fixed left-0 right-0 top-0 z-40 w-full px-6 py-4 transition-all duration-300 md:px-12 lg:px-16">
          <nav className="flex items-center justify-between">
            <button
              className="text-[#d4c5a9] md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden items-center gap-8 md:flex lg:gap-12">
              <Link href="/#about" className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                About
              </Link>
              <Link href="/#features" className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Game Features
              </Link>
            </div>

            <div className="hidden md:block" />

            <div className="hidden items-center gap-8 md:flex lg:gap-12">
              <Link href="/#community" className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Community
              </Link>
              <Link href="/login" className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Login
              </Link>
              <button className="text-[#d4c5a9] transition-colors hover:text-white" aria-label="User profile">
                <User size={20} />
              </button>
            </div>

            <button className="text-[#d4c5a9] transition-colors hover:text-white md:hidden" aria-label="User profile">
              <User size={20} />
            </button>
          </nav>

          {mobileMenuOpen && (
            <div className="mt-4 flex flex-col gap-4 rounded-lg bg-black/80 p-6 backdrop-blur-sm md:hidden">
              <Link href="/#about" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                About
              </Link>
              <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Game Features
              </Link>
              <Link href="/#community" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Community
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Login
              </Link>
            </div>
          )}
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 pb-12 text-center md:px-12 lg:px-16">
          <div className="w-full">
            <p className="font-sans text-4xl tracking-[0.1em] text-[#c9b896] md:text-5xl lg:text-6xl">Remnantborn</p>
            <p className="mt-1 font-serif text-xl italic text-[#b8a882] md:text-2xl">The Last Tear</p>

            <h1 className="mt-10 font-sans text-2xl leading-tight tracking-[0.08em] text-[#d4c5a9] uppercase md:text-4xl">
              Welcome To The <span className="text-[#c9b896]">Game Remnantborn</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl font-serif text-base leading-relaxed text-[#b8a882] italic md:text-lg">
              To continue playing "Remnantborn the last tear" you need to connect to a game account. Enter follow details to sign in to an existing account or you can create an account
            </p>

            <form className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-4 md:mt-10" onSubmit={handleLoginSubmit}>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                required
                className="h-12 w-full rounded-[18px] border border-[#6b5f45]/50 bg-[linear-gradient(145deg,rgba(82,74,52,0.3)_0%,rgba(52,47,35,0.45)_50%,rgba(35,32,25,0.55)_100%)] px-6 text-center font-sans text-sm tracking-[0.08em] text-[#d4c5a9] placeholder:text-[#a89876] focus:outline-none"
              />

              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                required
                className="h-12 w-full rounded-[18px] border border-[#6b5f45]/50 bg-[linear-gradient(145deg,rgba(82,74,52,0.3)_0%,rgba(52,47,35,0.45)_50%,rgba(35,32,25,0.55)_100%)] px-6 text-center font-sans text-sm tracking-[0.08em] text-[#d4c5a9] placeholder:text-[#a89876] focus:outline-none"
              />

              <button
                type="submit"
                className="mt-4 min-w-[160px] rounded-[18px] border border-[#6b5f45]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#d4c5a9] backdrop-blur-sm transition-all duration-300 hover:border-[#8a7d5a] hover:text-white"
                style={{
                  background: "linear-gradient(145deg, rgba(82, 74, 52, 0.65) 0%, rgba(52, 47, 35, 0.75) 50%, rgba(35, 32, 25, 0.85) 100%)",
                }}
              >
                SIGN IN
              </button>
            </form>

            <p className="mt-8 font-serif text-base text-[#b8a882] md:mt-10 md:text-lg">
              Don&apos;t have an account? <Link href="/signup" className="text-[#d4c5a9] transition-colors hover:text-white">Sign up</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
