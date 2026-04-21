/**
 * What: Public landing page with hero media, navbar interactions, and section navigation.
 * Why: This is the first-touch experience before users move into auth and community routes.
 */
"use client"

import { ChevronDown, User, Menu, X, Instagram, Facebook, Twitter } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FightRemnantsCharacterGroup } from "@/components/home/fight-remnants-character-group"

type FighterParallax = Record<string, { x: number; y: number }>

const discoverFilmFrames = [
  "/assets/old-film-strip/film1.jpeg",
  "/assets/old-film-strip/film2.jpeg",
  "/assets/old-film-strip/film3.jpeg",
  "/assets/old-film-strip/film4.jpeg",
  "/assets/old-film-strip/film5.jpeg",
  "/assets/old-film-strip/film6.jpeg",
]

const remnantFighters = [
  {
    key: "lira",
    name: "Lira",
    title: "The Verdant Witch",
    image: "/assets/fighters/Lira.png",
    auraClass: "fighter-aura-lira",
    floatClass: "fighter-float-left",
    stats: [
      { label: "Attack", value: 72 },
      { label: "Magic", value: 96 },
      { label: "Speed", value: 79 },
    ],
  },
  {
    key: "zoory",
    name: "Zoory",
    title: "The Astral Ranger",
    image: "/assets/fighters/Zoory.png",
    auraClass: "fighter-aura-zoory",
    floatClass: "fighter-float-center",
    stats: [
      { label: "Attack", value: 88 },
      { label: "Magic", value: 84 },
      { label: "Speed", value: 92 },
    ],
  },
  {
    key: "kade",
    name: "Kade",
    title: "The Shadow Blademaster",
    image: "/assets/fighters/Kade.png",
    auraClass: "fighter-aura-kade",
    floatClass: "fighter-float-right",
    stats: [
      { label: "Attack", value: 93 },
      { label: "Magic", value: 52 },
      { label: "Speed", value: 89 },
    ],
  },
]

const fighterDustParticles = [
  { left: "8%", size: 6, delay: "-0.2s", duration: "4.9s", opacity: 0.9 },
  { left: "18%", size: 5, delay: "-1.5s", duration: "4.4s", opacity: 0.84 },
  { left: "30%", size: 7, delay: "-0.9s", duration: "5.2s", opacity: 0.92 },
  { left: "42%", size: 5, delay: "-2.4s", duration: "4.6s", opacity: 0.8 },
  { left: "54%", size: 6, delay: "-1.1s", duration: "5s", opacity: 0.86 },
  { left: "66%", size: 5, delay: "-2.2s", duration: "4.5s", opacity: 0.82 },
  { left: "78%", size: 7, delay: "-0.6s", duration: "5.3s", opacity: 0.94 },
  { left: "90%", size: 5, delay: "-1.8s", duration: "4.8s", opacity: 0.8 },
]

export default function RemnantbornLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [fighterParallax, setFighterParallax] = useState<FighterParallax>({})

  // Quick visual polish: changing navbar style based on scroll depth.
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Floating CTA pulse cycle so the primary action feels alive without being noisy.
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

  const handleFighterMouseMove = (fighterKey: string, event: React.MouseEvent<HTMLElement>) => {
    const target = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - target.left) / target.width
    const y = (event.clientY - target.top) / target.height

    // Keep the depth subtle so it feels like layered 2.5D instead of a tilt effect.
    const parallaxX = (x - 0.5) * 14
    const parallaxY = (y - 0.5) * 10

    setFighterParallax((prev) => ({
      ...prev,
      [fighterKey]: { x: parallaxX, y: parallaxY },
    }))
  }

  const resetFighterParallax = (fighterKey: string) => {
    setFighterParallax((prev) => ({
      ...prev,
      [fighterKey]: { x: 0, y: 0 },
    }))
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
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                About
              </a>
              <Link
                href="#features"
                className="font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                Game Features
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="text-[#D9D9D9] md:hidden"
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
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                Community
              </a>
              <Link
                href="/login"
                className="font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                Login
              </Link>
              <button
                className="text-[#D9D9D9] transition-colors hover:text-[#FFFFFF]"
                aria-label="User profile"
                onClick={() => window.location.href = "/login"}
              >
                <User size={20} />
              </button>
            </div>

            {/* Mobile User Icon */}
            <button
              className="text-[#D9D9D9] transition-colors hover:text-[#FFFFFF] md:hidden"
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
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                About
              </a>
              <Link
                href="#features"
                className="font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Game Features
              </Link>
              <Link
                href="#community"
                className="font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </Link>
              <Link
                href="/login"
                className="font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
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
          <h1 className="font-sans text-5xl font-normal tracking-[0.12em] text-[#CCAE68] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] sm:text-6xl md:text-7xl lg:text-8xl">
            Remnantborn
          </h1>

          {/* Subtitle */}
          <p className="mt-1 font-serif text-2xl font-normal italic text-[#D9D9D9] drop-shadow-sm sm:text-3xl md:text-4xl">
            The Last Tear
          </p>

          {/* Tagline */}
          <p className="mt-6 font-sans text-xs tracking-[0.25em] text-[#A6A921] uppercase drop-shadow sm:text-sm md:mt-8 md:text-base">
            Fight the Remnants, Awaken Your True Power
          </p>

          {/* CTA Buttons */}
          <div className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:gap-8 md:mt-24 lg:mt-32 lg:gap-48">
            <button 
              className="min-w-[160px] rounded-[18px] border border-[#A6A921]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#D9D9D9] backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF]"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.78) 0%, rgba(40, 57, 26, 0.74) 52%, rgba(166, 169, 33, 0.28) 100%)',
              }}
            >
              Watch Trailer
            </button>

            <button 
              className="min-w-[160px] rounded-[18px] border border-[#A6A921]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#D9D9D9] backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF]"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.78) 0%, rgba(40, 57, 26, 0.74) 52%, rgba(166, 169, 33, 0.28) 100%)',
              }}
            >
              Play Game
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-12 flex flex-col items-center gap-1 md:mt-16">
            <span className="font-sans text-xs tracking-[0.3em] text-[#D9D9D9] uppercase">
              Scroll
            </span>
            <div className="flex flex-col items-center">
              <ChevronDown size={16} className="text-[#D9D9D9] animate-bounce" />
              <ChevronDown size={16} className="-mt-2 text-[#D9D9D9] animate-bounce" style={{ animationDelay: '0.1s' }} />
            </div>
          </div>
        </main>
      </div>

      {/* About Section */}
      <section id="about" className="relative w-full bg-[#051312] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          {/* Section Title */}
          <h2 className="mt-3 font-sans text-3xl font-normal tracking-[0.15em] text-[#CCAE68] uppercase md:mt-4 md:text-4xl lg:mt-5 lg:text-5xl">
            Fight The Remnants
          </h2>

          {/* Content Grid */}
          <div className="mt-12 flex flex-col items-center gap-12 lg:mt-16 lg:flex-row lg:items-center lg:gap-20 xl:gap-24">
            {/* Left Column - Animated Character Group */}
            <div className="flex w-full flex-shrink-0 justify-center lg:w-[43%] lg:justify-start lg:pr-4 lg:-ml-6 xl:pr-8 xl:-ml-10">
              <FightRemnantsCharacterGroup />
            </div>

            {/* Right Column - Text Content */}
            <div className="relative flex flex-1 flex-col gap-8 text-center lg:-mt-5 lg:-ml-8 lg:pt-0 lg:text-left xl:-ml-10">
              <div className="relative max-w-[35rem] lg:pl-1 xl:max-w-[36rem] xl:pl-2">
                <p className="font-sans text-[14px] leading-[1.6] tracking-[0.035em] text-[#D9D9D9] uppercase md:text-[15px]">
                  Remnantborn – The Last Tear is a fantasy action fighting game set in a world where magic and reality collide. After a devastating catastrophe shattered the balance of the realm, only fragments of power—known as Remnants—remain.
                </p>

                <p className="mt-10 font-sans text-[14px] leading-[1.6] tracking-[0.035em] text-[#D9D9D9] uppercase md:text-[15px]">
                  You play as a Remnantborn, a warrior born from loss, memory, and the final tear left behind by a dying world. Each battle blends fast-paced combat, magical abilities, and raw physical strength as you fight corrupted enemies and uncover the truth behind the world's collapse.
                </p>
              </div>

              <div className="pointer-events-none absolute -bottom-[3rem] right-[-0.75rem] h-64 w-64 translate-y-1/4 sm:-bottom-[4.5rem] sm:right-[-2.75rem] sm:h-96 sm:w-96 lg:-bottom-[6.5rem] lg:right-[-6.25rem] lg:h-[34rem] lg:w-[34rem]">
                <Image
                  src="/assets/characters/about1.png"
                  alt="Monstera leaf"
                  fill
                  sizes="(max-width: 640px) 256px, (max-width: 1024px) 384px, 544px"
                  className="object-contain object-right-bottom opacity-95"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Discover Section */}
      <section id="discover" className="relative overflow-hidden bg-[#051312] py-18 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <h2 className="mt-3 font-sans text-3xl font-normal tracking-[0.15em] text-[#CCAE68] uppercase md:mt-4 md:text-4xl lg:mt-5 lg:text-5xl">
            Discover The Journey
          </h2>
          <div className="mx-auto mt-8 max-w-3xl text-center font-sans text-[14px] leading-[1.6] tracking-[0.035em] text-[#D9D9D9] uppercase md:mt-9 md:text-[15px]">
            <p>
              The world of Remnantborn is alive with mystery. From tranquil valleys to dangerous ruins, every corner
              holds a story waiting to be uncovered. Step into the unknown, for the echoes of the past are
              calling-and only the brave shall claim the secrets of the Last Tear.
            </p>
          </div>

          <div className="relative mt-10 sm:mt-12">
            <div className="film-strip-shell mx-auto w-full max-w-[1220px]">
            <div className="film-strip-perforation film-strip-perforation-top" aria-hidden="true" />

            <div className="film-strip-marquee group">
              <div className="film-strip-track">
                <div className="film-strip-reel">
                  {discoverFilmFrames.map((src, index) => (
                    <article key={`reel-a-${index}`} className="film-frame">
                      <Image
                        src={src}
                        alt={`Discover frame ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 380px"
                        className="film-frame-image"
                      />
                    </article>
                  ))}
                </div>

                <div className="film-strip-reel" aria-hidden="true">
                  {discoverFilmFrames.map((src, index) => (
                    <article key={`reel-b-${index}`} className="film-frame">
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 380px"
                        className="film-frame-image"
                      />
                    </article>
                  ))}
                </div>
              </div>

              <div className="film-grain-overlay" aria-hidden="true" />
            </div>

            <div className="film-strip-perforation film-strip-perforation-bottom" aria-hidden="true" />
            </div>

            <div className="pointer-events-none absolute z-[3] -bottom-[3.25rem] right-[-0.75rem] h-56 w-56 sm:-bottom-[4.25rem] sm:right-[-2.75rem] sm:h-80 sm:w-80 lg:-bottom-[6rem] lg:right-[-6.25rem] lg:h-[26rem] lg:w-[26rem]">
              <Image
                src="/assets/old-film-strip/leaf2.png"
                alt=""
                fill
                sizes="(max-width: 640px) 224px, (max-width: 1024px) 320px, 416px"
                className="object-contain object-right-bottom opacity-95"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Remnant Fighters Section */}
      <section id="fighters" className="relative overflow-hidden bg-[#051312] py-18 md:py-24">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <h2 className="mt-3 text-center font-sans text-3xl font-normal tracking-[0.15em] text-[#CCAE68] uppercase md:mt-4 md:text-4xl lg:mt-5 lg:text-5xl">
            Remnant Fighters
          </h2>

          <div className="relative mt-12 overflow-hidden rounded-[20px] border border-[#A6A921]/30 bg-[radial-gradient(circle_at_center,rgba(166,169,33,0.18)_0%,rgba(5,19,18,0.92)_58%)] px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="pointer-events-none absolute inset-x-0 bottom-[3%] z-[1] h-[48%] overflow-hidden sm:bottom-[4%] sm:h-[52%] md:h-[56%] lg:bottom-[5%] lg:h-[60%] xl:h-[64%]">
              <Image
                src="/assets/fighters/fighters-rock.png"
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 92vw, 1200px"
                className="object-cover object-[center_38%] opacity-78"
              />
            </div>

            <div className="fighter-fog fighter-fog-back" aria-hidden="true" />

            <div className="relative z-[3] grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
              {remnantFighters.map((fighter) => (
                <article
                  key={fighter.key}
                  className="fighter-card group relative mx-auto flex w-full max-w-[440px] flex-col items-center rounded-2xl border border-[#A6A921]/28 bg-[linear-gradient(180deg,rgba(5,19,18,0.55)_0%,rgba(5,19,18,0.3)_100%)] px-4 pb-5 pt-3 text-center transition-transform duration-300 hover:scale-[1.05]"
                  onMouseMove={(event) => handleFighterMouseMove(fighter.key, event)}
                  onMouseLeave={() => resetFighterParallax(fighter.key)}
                >
                  <div className="fighter-card-trace" aria-hidden="true" />
                  <div className="fighter-card-hover-dust" aria-hidden="true" />

                  <div className={`pointer-events-none absolute bottom-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full blur-2xl transition-all duration-300 group-hover:scale-110 ${fighter.auraClass}`} />

                  <div
                    className="relative h-[240px] w-[190px] transition-transform duration-200 ease-out"
                    style={{
                      transform: `translate3d(${fighterParallax[fighter.key]?.x ?? 0}px, ${fighterParallax[fighter.key]?.y ?? 0}px, 0)`,
                    }}
                  >
                    <div className={`relative h-full w-full ${fighter.floatClass}`}>
                      <Image
                        src={fighter.image}
                        alt={fighter.name}
                        fill
                        sizes="(max-width: 1024px) 190px, 220px"
                        className="object-contain object-bottom"
                      />
                    </div>
                  </div>

                  <div className="fighter-ground-dust" aria-hidden="true">
                    {fighterDustParticles.map((particle, index) => (
                      <span
                        key={`${fighter.key}-dust-${index}`}
                        className="fighter-ground-dust-particle"
                        style={{
                          left: particle.left,
                          width: `${particle.size}px`,
                          height: `${particle.size}px`,
                          animationDelay: particle.delay,
                          animationDuration: particle.duration,
                          opacity: particle.opacity,
                        }}
                      />
                    ))}
                  </div>

                  <h3 className="mt-4 font-sans text-2xl tracking-[0.12em] text-[#FFFFFF] uppercase">{fighter.name}</h3>
                  <p className="mt-1 font-sans text-xs tracking-[0.14em] text-[#CCAE68] uppercase">{fighter.title}</p>

                  <div className="mt-5 w-full max-w-[340px] space-y-2.5 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    {fighter.stats.map((stat) => (
                      <div key={`${fighter.key}-${stat.label}`} className="grid grid-cols-[70px_1fr_34px] items-center gap-2 text-left">
                        <span className="font-sans text-[11px] tracking-[0.08em] text-[#D9D9D9] uppercase">{stat.label}</span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#FFFFFF]/12">
                          <div
                            className="h-full origin-left scale-x-0 rounded-full bg-[linear-gradient(90deg,#A6A921_0%,#CCAE68_100%)] transition-transform duration-700 ease-out group-hover:scale-x-100"
                            style={{ width: `${stat.value}%` }}
                          />
                        </div>
                        <span className="font-sans text-[10px] tracking-[0.08em] text-[#FFFFFF]">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="fighter-fog fighter-fog-front" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Community Section + Footer */}
      <section id="community" className="relative w-full overflow-hidden border-t border-[#A6A921]/35">
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
          <div className="mx-auto max-w-5xl rounded-[20px] border border-[#A6A921]/45 bg-[linear-gradient(160deg,rgba(166,169,33,0.16)_0%,rgba(5,19,18,0.68)_46%,rgba(5,19,18,0.8)_100%)] px-6 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm md:px-12 md:py-16">
            <h2 className="font-sans text-3xl font-normal tracking-[0.15em] text-[#CCAE68] uppercase md:text-5xl">
              Join Our Community
            </h2>
            <p className="mx-auto mt-7 max-w-3xl font-serif text-base leading-relaxed text-[#D9D9D9] italic md:text-lg">
              Join our community to share strategies, discuss lore, and fight alongside others who were born from the remnants.
            </p>
            <button
              className="mt-8 min-w-[160px] rounded-[18px] border border-[#A6A921]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#D9D9D9] backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF] md:mt-12"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.78) 0%, rgba(40, 57, 26, 0.74) 52%, rgba(166, 169, 33, 0.28) 100%)',
              }}
              onClick={() => window.location.href = "/login"}
            >
              Join Community
            </button>
          </div>

          <footer className="mt-16 md:mt-24">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-end">
              <div className="text-center md:text-left">
                <p className="font-sans text-4xl tracking-[0.1em] text-[#CCAE68] md:text-5xl">Remnantborn</p>
                <p className="mt-1 font-serif text-xl italic text-[#D9D9D9] md:text-2xl">The Last Tear</p>
              </div>

              <div className="flex items-center gap-10">
                <a href="#" aria-label="Instagram" className="text-[#D9D9D9] transition-colors hover:text-[#FFFFFF]">
                  <Instagram size={36} strokeWidth={2.2} />
                </a>
                <a href="#" aria-label="Facebook" className="text-[#D9D9D9] transition-colors hover:text-[#FFFFFF]">
                  <Facebook size={36} strokeWidth={2.2} />
                </a>
                <a href="#" aria-label="Twitter" className="text-[#D9D9D9] transition-colors hover:text-[#FFFFFF]">
                  <Twitter size={36} strokeWidth={2.2} />
                </a>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#A6A921]/45 pt-6 text-center md:flex-row md:pt-8">
              <p className="font-sans text-xs tracking-[0.08em] text-[#D9D9D9]">Copyright 2026</p>
              <a href="#" className="font-sans text-sm tracking-[0.1em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]">Privacy Policy</a>
              <a href="#" className="font-sans text-sm tracking-[0.1em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]">Terms & Conditions</a>
              <a href="#" className="font-sans text-sm tracking-[0.1em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]">Ad Choices</a>
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
              className="rounded-l-[18px] border border-r-0 border-[#A6A921]/50 px-6 py-4 font-sans text-[12px] font-normal tracking-[0.15em] text-[#D9D9D9] uppercase shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF]"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.9) 0%, rgba(40, 57, 26, 0.86) 52%, rgba(166, 169, 33, 0.36) 100%)',
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
