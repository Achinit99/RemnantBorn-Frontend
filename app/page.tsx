"use client"

import { ChevronDown, User, Menu, X, Instagram, Facebook, Twitter } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function RemnantbornLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const animationCycle = () => {
      // Show button -> slide in
      setShowFloatingButton(true)
      
      // Hide button after 1 second -> slide out
      setTimeout(() => {
        setShowFloatingButton(false)
      }, 1000)
    }

    // Initial delay before first appearance
    const initialTimeout = setTimeout(() => {
      animationCycle()
    }, 2000)

    // Repeat every 5 seconds 
    const interval = setInterval(() => {
      animationCycle()
    }, 5000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="relative w-full overflow-hidden scroll-smooth">
      {/* Video Element */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover" //object-contain
      >
      <source src="/videos/hero-bg.mp4" type="video/mp4" />
      {/* if video not view */}
      Your browser does not support the video tag.
      </video>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col pt-16">
        {/* Navigation */}
        <header 
          className={`fixed left-0 right-0 top-0 z-40 w-full px-6 py-4 transition-all duration-300 md:px-12 lg:px-16 ${
            isScrolled 
              ? 'bg-black/70 backdrop-blur-md shadow-lg' 
              : 'bg-transparent'
          }`}
        >
          <nav className="flex items-center justify-between">
            {/* Left Nav */}
            <div className="hidden items-center gap-8 md:flex lg:gap-12">
              <a
                href="#about"
                onClick={(e) => handleSmoothScroll(e, 'about')}
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
              >
                About
              </a>
              <Link
                href="#features"
                className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
              >
                Game Features
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="text-[#d4c5a9] md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Center spacer for logo area */}
            <div className="hidden md:block" />

            {/* Right Nav */}
            <div className="hidden items-center gap-8 md:flex lg:gap-12">
              <a
                href="#community"
                onClick={(e) => handleSmoothScroll(e, 'community')}
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
              >
                Community
              </a>
              <Link
                href="/login"
                className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
              >
                Login
              </Link>
              <button
                className="text-[#d4c5a9] transition-colors hover:text-white"
                aria-label="User profile"
                onClick={() => window.location.href = "/login"}
              >
                <User size={20} />
              </button>
            </div>

            {/* Mobile User Icon */}
            <button
              className="text-[#d4c5a9] transition-colors hover:text-white md:hidden"
              aria-label="User profile"
              onClick={() => window.location.href = "/login"}
            >
              <User size={20} />
            </button>
          </nav>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mt-4 flex flex-col gap-4 rounded-lg bg-black/80 p-6 backdrop-blur-sm md:hidden">
              <a
                href="#about"
                onClick={(e) => handleSmoothScroll(e, 'about')}
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
              >
                About
              </a>
              <Link
                href="#features"
                className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Game Features
              </Link>
              <Link
                href="#community"
                className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </Link>
              <Link
                href="/login"
                className="font-sans text-sm tracking-[0.2em] text-[#d4c5a9] uppercase transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </header>

        {/* Hero Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          {/* Title */}
          <h1 className="font-sans text-5xl font-normal tracking-[0.12em] text-[#c9b896] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl lg:text-8xl">
            Remnantborn
          </h1>

          {/* Subtitle */}
          <p className="mt-1 font-serif text-2xl font-normal italic text-[#b8a882] drop-shadow-sm sm:text-3xl md:text-4xl">
            The Last Tear
          </p>

          {/* Tagline */}
          <p className="mt-6 font-sans text-xs tracking-[0.25em] text-[#d4c5a9] uppercase drop-shadow sm:text-sm md:mt-8 md:text-base">
            Fight the Remnants, Awaken Your True Power
          </p>

          {/* CTA Buttons */}
          <div className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:gap-8 md:mt-24 lg:mt-32 lg:gap-48">
            <button 
              className="min-w-[160px] rounded-[18px] border border-[#6b5f45]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#d4c5a9] backdrop-blur-sm transition-all duration-300 hover:border-[#8a7d5a] hover:text-white"
              style={{
                background: 'linear-gradient(145deg, rgba(82, 74, 52, 0.65) 0%, rgba(52, 47, 35, 0.75) 50%, rgba(35, 32, 25, 0.85) 100%)',
              }}
            >
              Watch Trailer
            </button>

            <button 
              className="min-w-[160px] rounded-[18px] border border-[#6b5f45]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#d4c5a9] backdrop-blur-sm transition-all duration-300 hover:border-[#8a7d5a] hover:text-white"
              style={{
                background: 'linear-gradient(145deg, rgba(82, 74, 52, 0.65) 0%, rgba(52, 47, 35, 0.75) 50%, rgba(35, 32, 25, 0.85) 100%)',
              }}
            >
              Play Game
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-12 flex flex-col items-center gap-1 md:mt-16">
            <span className="font-sans text-xs tracking-[0.3em] text-[#d4c5a9] uppercase">
              Scroll
            </span>
            <div className="flex flex-col items-center">
              <ChevronDown size={16} className="text-[#d4c5a9] animate-bounce" />
              <ChevronDown size={16} className="-mt-2 text-[#d4c5a9] animate-bounce" style={{ animationDelay: '0.1s' }} />
            </div>
          </div>
        </main>
      </div>

      {/* About Section */}
      <section id="about" className="relative w-full bg-[#0a0a09] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          {/* Section Title */}
          <h2 className="font-sans text-3xl font-normal tracking-[0.15em] text-[#c9b896] uppercase md:text-4xl lg:text-5xl">
            Fight The Remnants
          </h2>

          {/* Content Grid */}
          <div className="mt-12 flex flex-col items-center gap-12 lg:mt-16 lg:flex-row lg:items-start lg:gap-16">
            {/* Left Column - Logo/Emblem */}
            <div className="flex flex-shrink-0 flex-col items-center">
              <div className="relative h-[280px] w-[280px] md:h-[320px] md:w-[320px]">
                <img
                  src="/images/remnantborn-emblem.jpg"
                  alt="Remnantborn emblem"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="font-sans text-sm tracking-[0.2em] text-[#c9b896] uppercase">Remnantborn</p>
                <p className="font-serif text-xs italic text-[#8a7d5a]">The Last Tear</p>
              </div>
            </div>

            {/* Right Column - Text Content */}
            <div className="flex flex-1 flex-col gap-8 lg:pt-4">
              <div className="max-w-2xl">
                <p className="font-serif text-base leading-relaxed text-[#b8a882] italic md:text-lg">
                  Remnantborn – The Last Tear is a fantasy action fighting game set in a world where magic and reality collide. After a devastating catastrophe shattered the balance of the realm, only fragments of power—known as Remnants—remain.
                </p>

                <p className="mt-6 font-serif text-base leading-relaxed text-[#b8a882] italic md:text-lg">
                  You play as a Remnantborn, a warrior born from loss, memory, and the final tear left behind by a dying world. Each battle blends fast-paced combat, magical abilities, and raw physical strength as you fight corrupted enemies and uncover the truth behind the world's collapse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section + Footer */}
      <section id="community" className="relative w-full overflow-hidden border-t border-[#2f2a1e]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,12,13,0.95)_0%,rgba(3,11,13,0.9)_45%,rgba(13,20,13,0.4)_100%)]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-8 pt-16 md:px-12 md:pb-10 md:pt-24 lg:px-16">
          <div className="mx-auto max-w-5xl rounded-[20px] border border-[#6b5f45]/45 bg-[linear-gradient(160deg,rgba(59,54,42,0.28)_0%,rgba(19,32,34,0.64)_45%,rgba(12,20,22,0.72)_100%)] px-6 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm md:px-12 md:py-16">
            <h2 className="font-sans text-3xl font-normal tracking-[0.15em] text-[#c9b896] uppercase md:text-5xl">
              Join Our Community
            </h2>
            <p className="mx-auto mt-7 max-w-3xl font-serif text-base leading-relaxed text-[#b8a882] italic md:text-lg">
              Join our community to share strategies, discuss lore, and fight alongside others who were born from the remnants.
            </p>
            <button
              className="mt-8 min-w-[160px] rounded-[18px] border border-[#6b5f45]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#d4c5a9] backdrop-blur-sm transition-all duration-300 hover:border-[#8a7d5a] hover:text-white md:mt-12"
              style={{
                background: 'linear-gradient(145deg, rgba(82, 74, 52, 0.65) 0%, rgba(52, 47, 35, 0.75) 50%, rgba(35, 32, 25, 0.85) 100%)',
              }}
              onClick={() => window.location.href = "/login"}
            >
              Join Community
            </button>
          </div>

          <footer className="mt-16 md:mt-24">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-end">
              <div className="text-center md:text-left">
                <p className="font-sans text-4xl tracking-[0.1em] text-[#c9b896] md:text-5xl">Remnantborn</p>
                <p className="mt-1 font-serif text-xl italic text-[#b8a882] md:text-2xl">The Last Tear</p>
              </div>

              <div className="flex items-center gap-10">
                <a href="#" aria-label="Instagram" className="text-[#d4c5a9] transition-colors hover:text-white">
                  <Instagram size={36} strokeWidth={2.2} />
                </a>
                <a href="#" aria-label="Facebook" className="text-[#d4c5a9] transition-colors hover:text-white">
                  <Facebook size={36} strokeWidth={2.2} />
                </a>
                <a href="#" aria-label="Twitter" className="text-[#d4c5a9] transition-colors hover:text-white">
                  <Twitter size={36} strokeWidth={2.2} />
                </a>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#6b5f45]/45 pt-6 text-center md:flex-row md:pt-8">
              <p className="font-sans text-xs tracking-[0.08em] text-[#d4c5a9]">Copyright 2026</p>
              <a href="#" className="font-sans text-sm tracking-[0.1em] text-[#d4c5a9] uppercase transition-colors hover:text-white">Privacy Policy</a>
              <a href="#" className="font-sans text-sm tracking-[0.1em] text-[#d4c5a9] uppercase transition-colors hover:text-white">Terms & Conditions</a>
              <a href="#" className="font-sans text-sm tracking-[0.1em] text-[#d4c5a9] uppercase transition-colors hover:text-white">Ad Choices</a>
            </div>
          </footer>
        </div>
      </section>

      {/* Floating Play Game Button */}
      <AnimatePresence>
        {showFloatingButton && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.5 
            }}
            className="fixed bottom-8 right-0 z-50"
          >
            <button 
              className="rounded-l-[18px] border border-r-0 border-[#6b5f45]/50 px-6 py-4 font-sans text-[12px] font-normal tracking-[0.15em] text-[#d4c5a9] uppercase shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#8a7d5a] hover:text-white"
              style={{
                background: 'linear-gradient(145deg, rgba(82, 74, 52, 0.85) 0%, rgba(52, 47, 35, 0.9) 50%, rgba(35, 32, 25, 0.95) 100%)',
              }}
            >
              Play Game<br />Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
