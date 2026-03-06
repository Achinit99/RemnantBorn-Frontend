"use client"

import { Menu, User, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

const ctaButtonStyle = {
  background: "linear-gradient(145deg, rgba(82, 74, 52, 0.65) 0%, rgba(52, 47, 35, 0.75) 50%, rgba(35, 32, 25, 0.85) 100%)",
}

export default function SignupPage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isAge16, setIsAge16] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const nextStep = () => {
    if (step === 3) {
      // Final step - redirect to login
      router.push("/login")
    } else if (step < 3) {
      setStep((prev) => prev + 1)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020b0d] text-white">
      <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover">
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[radial-gradient(45%_65%_at_52%_55%,rgba(161,151,84,0.36)_0%,rgba(24,43,35,0.15)_45%,rgba(2,10,13,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,17,0.74)_0%,rgba(1,10,12,0.92)_48%,rgba(2,10,12,0.97)_100%)]" />

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
              {step === 1 && "Enter your email you prefer to create the game account. You will be able to join the community with this email later."}
              {step === 2 && (
                <>
                  An account has been created using the email address: <span className="font-sans text-[#d4c5a9]">{email || "user@email.com"}</span>.
                  <br />
                  Please enter a username and a password below.
                </>
              )}
              {step === 3 && (
                <>
                  To confirm your email, a code has been sent to the email address: <span className="font-sans text-[#d4c5a9]">{email || "user@email.com"}</span>.
                  <br />
                  Please verify your account by entering the code below.
                </>
              )}
            </p>

            <form
              className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-4 md:mt-10"
              onSubmit={(e) => {
                e.preventDefault()
                nextStep()
              }}
            >
              {step === 1 && (
                <>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="h-12 w-full rounded-[18px] border border-[#6b5f45]/50 bg-[linear-gradient(145deg,rgba(82,74,52,0.3)_0%,rgba(52,47,35,0.45)_50%,rgba(35,32,25,0.55)_100%)] px-6 text-center font-sans text-sm tracking-[0.08em] text-[#d4c5a9] placeholder:text-[#a89876] focus:outline-none"
                    required
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <label htmlFor="username" className="sr-only">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="h-12 w-full rounded-[18px] border border-[#6b5f45]/50 bg-[linear-gradient(145deg,rgba(82,74,52,0.3)_0%,rgba(52,47,35,0.45)_50%,rgba(35,32,25,0.55)_100%)] px-6 text-center font-sans text-sm tracking-[0.08em] text-[#d4c5a9] placeholder:text-[#a89876] focus:outline-none"
                    required
                  />

                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-12 w-full rounded-[18px] border border-[#6b5f45]/50 bg-[linear-gradient(145deg,rgba(82,74,52,0.3)_0%,rgba(52,47,35,0.45)_50%,rgba(35,32,25,0.55)_100%)] px-6 text-center font-sans text-sm tracking-[0.08em] text-[#d4c5a9] placeholder:text-[#a89876] focus:outline-none"
                    required
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <div className="flex gap-3 justify-center md:gap-4">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        className="h-12 w-12 rounded-[12px] border border-[#6b5f45]/50 bg-[linear-gradient(145deg,rgba(82,74,52,0.3)_0%,rgba(52,47,35,0.45)_50%,rgba(35,32,25,0.55)_100%)] text-center font-sans text-lg tracking-[0.08em] text-[#d4c5a9] focus:outline-none focus:border-[#d4c5a9]"
                      />
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col gap-3 w-full">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAge16}
                        onChange={(e) => setIsAge16(e.target.checked)}
                        className="h-5 w-5 rounded border border-[#6b5f45]/50 bg-[#0d1312] cursor-pointer accent-[#d4c5a9]"
                      />
                      <span className="font-sans text-sm text-[#d4c5a9]">I am above age 16</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="h-5 w-5 rounded border border-[#6b5f45]/50 bg-[#0d1312] cursor-pointer accent-[#d4c5a9]"
                      />
                      <span className="font-sans text-sm text-[#d4c5a9]">I agree to the terms and conditions</span>
                    </label>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={step === 3 && (!isAge16 || !agreeTerms)}
                className="mt-4 min-w-[160px] rounded-[18px] border border-[#6b5f45]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#d4c5a9] backdrop-blur-sm transition-all duration-300 hover:border-[#8a7d5a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={ctaButtonStyle}
              >
                {step === 1 && "CONTINUE"}
                {step === 2 && "CONTINUE"}
                {step === 3 && "AGREE & CONTINUE"}
              </button>
            </form>

            <div className="mx-auto mt-10 flex w-full max-w-xl items-center gap-3 md:gap-4">
              {[1, 2, 3].map((n, index) => {
                const isActive = step >= n
                return (
                  <div key={n} className="flex flex-1 items-center">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-sans ${
                        isActive
                          ? "border-[#d4c5a9] bg-[#d4c5a9] text-[#0d1312]"
                          : "border-[#6b5f45]/70 text-[#9f926f]"
                      }`}
                    >
                      {n}
                    </div>
                    {index < 2 && (
                      <div
                        className={`ml-3 h-px flex-1 ${
                          step > n ? "bg-[#d4c5a9]" : "bg-[#6b5f45]/70"
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <p className="mt-8 font-serif text-base text-[#b8a882] md:mt-10 md:text-lg">
              Already have an account?{" "}
              <Link href="/login" className="text-[#d4c5a9] transition-colors hover:text-white">
                Log in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
