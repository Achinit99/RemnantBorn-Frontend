/**
 * What: Login screen with backend auth call and Supabase browser-session handshake.
 * Why: Keeps token storage, cookie setup, and post-login redirect logic in one flow.
 */
"use client"

import { Menu, User, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useState, type FormEvent } from "react"

import { authApi, extractAuthTokens, getApiErrorMessage } from "@/lib/auth-api"
import {
  ACCESS_TOKEN_STORAGE_KEY,
  createAuthCookieString,
  sanitizeNextPath,
} from "@/lib/auth"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function LoginPage() {
  const dynamic = 'force-dynamic';
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Main auth submit flow: API login, Supabase session sync, then redirect.
  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextPath = sanitizeNextPath(searchParams.get("next"))
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      const response = await authApi.post("/auth/login", {
        email,
        password,
      })

      const { accessToken, refreshToken } = extractAuthTokens(response.data)

      if (!accessToken) {
        throw new Error("Login succeeded, but no access token was returned.")
      }

      // This keeps backend auth and Supabase auth in step, so community features work immediately.
      const supabase = getSupabaseBrowserClient()

      if (supabase) {
        if (typeof refreshToken === "string" && refreshToken.length > 0) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (setSessionError) {
            throw new Error(`Unable to establish Supabase session: ${setSessionError.message}`)
          }
        } else {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (signInError) {
            throw new Error(`Unable to establish Supabase session: ${signInError.message}`)
          }
        }

        const sessionResult = await supabase.auth.getSession()
        console.log("Supabase session after login:", sessionResult.data.session)
      }

      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
      document.cookie = createAuthCookieString(accessToken)
      window.location.assign(nextPath)
      return
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to log in. Please try again."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020b0d] text-white">
      <video autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain object-center">
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
        <source src="/videos/bg-video.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[radial-gradient(45%_65%_at_75%_62%,rgba(161,151,84,0.28)_0%,rgba(24,43,35,0.08)_46%,rgba(2,10,13,0.58)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,17,0.42)_0%,rgba(1,10,12,0.58)_48%,rgba(2,10,12,0.68)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col pt-16">
        <header className="fixed left-0 right-0 top-0 z-[130] w-full px-6 py-4 transition-all duration-300 md:px-12 lg:px-16">
          <nav className="flex items-center justify-between">
            <button
              className="text-[#d4c5a9] md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden items-center gap-8 md:flex lg:gap-12">
              <Link href="/#about" className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                About
              </Link>
              <Link href="/#features" className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Game Features
              </Link>
            </div>

            <div className="hidden md:block" />

            <div className="hidden items-center gap-8 md:flex lg:gap-12">
              <Link href="/#community" className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Community
              </Link>
              <Link href="/login" className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
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
              <Link href="/#about" onClick={() => setMobileMenuOpen(false)} className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                About
              </Link>
              <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Game Features
              </Link>
              <Link href="/#community" onClick={() => setMobileMenuOpen(false)} className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Community
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="font-sans text-base tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white">
                Login
              </Link>
            </div>
          )}
        </header>

        <main className="relative mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 pb-12 text-center md:px-12 lg:px-16">
          <div className="pointer-events-none absolute bottom-0 left-[-2.5rem] hidden w-[230px] opacity-85 lg:block xl:w-[280px]">
            <Image
              src="/assets/fighters/Lira.png"
              alt=""
              width={280}
              height={386}
              sizes="(max-width: 1279px) 230px, 280px"
              className="h-auto w-full object-contain brightness-110 saturate-110"
            />
          </div>

          <div className="pointer-events-none absolute bottom-0 right-[-2.5rem] hidden w-[230px] opacity-85 lg:block xl:w-[280px]">
            <Image
              src="/assets/fighters/Kade.png"
              alt=""
              width={280}
              height={386}
              sizes="(max-width: 1279px) 230px, 280px"
              className="h-auto w-full object-contain brightness-110 saturate-110"
            />
          </div>

          <div className="w-full">
            <div className="mx-auto w-full max-w-[18.75rem] md:max-w-[22.5rem] lg:max-w-[26rem]">
              <Image
                src="/assets/brand/game-name.png"
                alt="Remnantborn The Last Tear"
                width={589}
                height={182}
                quality={100}
                sizes="(max-width: 768px) 300px, (max-width: 1024px) 360px, 416px"
                className="h-auto w-full object-contain"
              />
            </div>

            <h1 className="mt-10 font-sans text-xl leading-snug tracking-[0.08em] text-[#d4c5a9] uppercase md:text-xl">
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
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (errorMessage) {
                    setErrorMessage("")
                  }
                }}
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
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (errorMessage) {
                    setErrorMessage("")
                  }
                }}
                placeholder="Password"
                required
                className="h-12 w-full rounded-[18px] border border-[#6b5f45]/50 bg-[linear-gradient(145deg,rgba(82,74,52,0.3)_0%,rgba(52,47,35,0.45)_50%,rgba(35,32,25,0.55)_100%)] px-6 text-center font-sans text-sm tracking-[0.08em] text-[#d4c5a9] placeholder:text-[#a89876] focus:outline-none"
              />

              {errorMessage && (
                <p className="w-full rounded-[18px] border border-[#7b3d33] bg-[#2a120f]/80 px-4 py-3 text-center font-sans text-sm tracking-[0.04em] text-[#f0c2b6]">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 min-w-[160px] rounded-[18px] border border-[#6b5f45]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#d4c5a9] backdrop-blur-sm transition-all duration-300 hover:border-[#8a7d5a] hover:text-white"
                style={{
                  background: "linear-gradient(145deg, rgba(82, 74, 52, 0.65) 0%, rgba(52, 47, 35, 0.75) 50%, rgba(35, 32, 25, 0.85) 100%)",
                }}
              >
                {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
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
