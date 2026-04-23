/**
 * What: Public landing page with hero media, navbar interactions, and section navigation.
 * Why: This is the first-touch experience before users move into auth and community routes.
 */
"use client"

import { ChevronDown, User, Menu, X, Instagram, Facebook, Twitter } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef, type CSSProperties } from "react"
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion"
import Lenis from "@studio-freight/lenis"
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

const gameplayFeatures = [
  {
    title: "Echo Shift Combat",
    description: "Chain aerial slashes and elemental bursts with responsive timing windows.",
  },
  {
    title: "Relic Mutation Trees",
    description: "Shape each run with relic choices that alter stance, cooldowns, and finishers.",
  },
  {
    title: "Cinematic Raid Arenas",
    description: "Fight through collapsing sanctums with reactive hazards and layered bosses.",
  },
  {
    title: "Faction Hunt Events",
    description: "Join rotating server events where squads race to purify corrupted sectors.",
  },
]

type IntroPhase = "loading" | "assembled" | "transitioning" | "done"

const sectionRevealVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const staggerRevealVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
}

const fighterCardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 22,
    },
  },
}

const fighterAuraVariants = {
  hidden: { scale: 0.92, opacity: 0.46 },
  visible: {
    scale: 1,
    opacity: 0.7,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  hover: {
    scale: 1.2,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 22,
    },
  },
}

type MagneticButtonProps = {
  children: React.ReactNode
  className: string
  style?: CSSProperties
  onClick?: () => void
}

function MagneticButton({ children, className, style, onClick }: MagneticButtonProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 22, mass: 0.3 })
  const springY = useSpring(y, { stiffness: 300, damping: 22, mass: 0.3 })

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - (rect.left + rect.width / 2)
    const offsetY = event.clientY - (rect.top + rect.height / 2)

    x.set(offsetX * 0.18)
    y.set(offsetY * 0.18)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      className={`${className} will-change-transform`}
      style={{ ...style, x: springX, y: springY, transform: "translateZ(0)" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {children}
    </motion.button>
  )
}

type GameplayTiltCardProps = {
  title: string
  description: string
}

function GameplayTiltCard({ title, description }: GameplayTiltCardProps) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 240, damping: 26, mass: 0.35 })
  const smoothY = useSpring(pointerY, { stiffness: 240, damping: 26, mass: 0.35 })

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [11, -11])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-11, 11])
  const glareX = useTransform(smoothX, [-0.5, 0.5], [20, 80])
  const glareY = useTransform(smoothY, [-0.5, 0.5], [20, 80])

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,235,180,0.42) 0%, rgba(255,235,180,0) 56%)`

  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    pointerX.set(x)
    pointerY.set(y)
  }

  const handleLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <motion.article
      variants={sectionRevealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.25 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform", transform: "translateZ(0)" }}
      className="group relative overflow-hidden rounded-2xl border border-[#A6A921]/35 bg-[linear-gradient(160deg,rgba(5,19,18,0.72)_0%,rgba(7,23,22,0.86)_100%)] p-6 shadow-[0_22px_40px_rgba(0,0,0,0.4)]"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: glareBackground, transform: "translateZ(30px)", willChange: "transform" }}
      />
      <div className="relative" style={{ transform: "translateZ(28px)", willChange: "transform" }}>
        <h3 className="font-sans text-xl tracking-[0.11em] text-[#FFFFFF] uppercase">{title}</h3>
        <p className="mt-3 font-sans text-[13px] leading-relaxed tracking-[0.04em] text-[#D9D9D9] uppercase">{description}</p>
      </div>
    </motion.article>
  )
}

export default function RemnantbornLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [introPhase, setIntroPhase] = useState<IntroPhase>("loading")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [fighterParallax, setFighterParallax] = useState<FighterParallax>({})
  const lenisRef = useRef<Lenis | null>(null)
  const beginIntroTransition = () => {
    if (introPhase !== "assembled") {
      return
    }

    setIntroPhase("transitioning")
    window.setTimeout(() => {
      setIntroPhase("done")
    }, 1400)
  }

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight)
    updateViewportHeight()
    window.addEventListener("resize", updateViewportHeight)
    return () => window.removeEventListener("resize", updateViewportHeight)
  }, [])

  useEffect(() => {
    if (introPhase !== "loading") {
      return
    }

    const interval = window.setInterval(() => {
      setLoadingProgress((prev) => {
        const next = Math.min(100, prev + (prev < 60 ? 4 : prev < 85 ? 3 : 2))
        if (next >= 100) {
          window.clearInterval(interval)
          window.setTimeout(() => {
            setIntroPhase("assembled")
          }, 180)
        }
        return next
      })
    }, 55)

    return () => window.clearInterval(interval)
  }, [introPhase])

  useEffect(() => {
    if (introPhase === "done") {
      document.body.style.overflow = ""
      return
    }

    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [introPhase])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (introPhase !== "done") {
      return
    }

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.1,
    })

    lenisRef.current = lenis

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = window.requestAnimationFrame(raf)
    }

    rafId = window.requestAnimationFrame(raf)

    return () => {
      window.cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [introPhase])

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
    const lenis = lenisRef.current

    if (lenis) {
      lenis.scrollTo(`#${targetId}`, {
        duration: 1.2,
        offset: -84,
      })
    } else {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: "auto" })
      }
    }

    setMobileMenuOpen(false)
  }

  const handleScrollToTop = () => {
    const lenis = lenisRef.current

    if (lenis) {
      lenis.scrollTo(0, {
        duration: 1.2,
      })
    } else {
      window.scrollTo({ top: 0, behavior: "auto" })
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

  const introGlideY = viewportHeight > 0 ? -((viewportHeight / 2) - 66) : -360

  return (
    <div className="relative w-full overflow-hidden">
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

      <AnimatePresence>
        {introPhase !== "done" && (
          <motion.div
            className="fixed inset-0 z-[120] overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: introPhase === "transitioning" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-[#030307]" />

            {introPhase === "transitioning" && (
              <div className="absolute inset-0 grid grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={`wipe-${index}`}
                    className="bg-[#030307]"
                    initial={{ y: 0 }}
                    animate={{ y: "-110%" }}
                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: index * 0.12 }}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
              <motion.div
                className="relative w-full max-w-[26rem] sm:max-w-[30rem]"
                animate={
                  introPhase === "assembled"
                    ? { x: [0, -3, 3, -2, 2, 0], y: [0, 2, -2, 1, -1, 0], scale: 1 }
                    : introPhase === "transitioning"
                      ? { x: 0, y: introGlideY, scale: 0.2 }
                      : { x: 0, y: 0, scale: 1 }
                }
                transition={
                  introPhase === "assembled"
                    ? { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                    : {
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                      }
                }
                style={{ willChange: "transform" }}
              >
                <motion.div
                  className="relative aspect-square w-full"
                  animate={
                    introPhase === "transitioning"
                      ? { scale: 1, opacity: 1 }
                      : {
                          scale: [1, 1.04, 0.985, 1.03, 1],
                          opacity: [1, 0.9, 1, 0.92, 1],
                        }
                  }
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    className="absolute inset-[7%] z-[1] overflow-hidden rounded-full"
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={
                      introPhase === "loading"
                        ? { opacity: [0, 1], scale: [0.2, 1.12, 1] }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                    style={{ filter: introPhase !== "loading" ? "drop-shadow(0 0 16px rgba(157, 214, 255, 0.6))" : undefined }}
                  >
                    <Image
                      src="/assets/brand/logo/main-tear.png"
                      alt="Main Tear"
                      fill
                      priority
                      quality={100}
                      sizes="(max-width: 768px) 420px, 500px"
                      className="object-contain"
                    />
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 z-[2]"
                    initial={{ opacity: 0, scale: 0.2, rotate: -40 }}
                    animate={
                      introPhase === "loading"
                        ? { opacity: [0, 1], scale: [0.2, 1.1, 1], rotate: [-40, 0] }
                        : { opacity: 1, scale: 1, rotate: [0, -360] }
                    }
                    transition={
                      introPhase === "loading"
                        ? { duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }
                        : { duration: 34, ease: "linear", repeat: Infinity }
                    }
                  >
                    <Image
                      src="/assets/brand/logo/vine-circle.png"
                      alt=""
                      fill
                      priority
                      quality={100}
                      sizes="(max-width: 768px) 420px, 500px"
                      className="object-contain"
                    />
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 z-[6] pointer-events-none"
                    initial={{ opacity: 0, scale: 0.42, rotate: -20 }}
                    animate={
                      introPhase === "loading"
                        ? { opacity: [0, 1], scale: [0.42, 1.08, 1], rotate: [-20, 0] }
                        : { opacity: 1, scale: 1, rotate: [0, 360] }
                    }
                    transition={
                      introPhase === "loading"
                        ? { duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.1 }
                        : { duration: 16, ease: "linear", repeat: Infinity }
                    }
                  >
                    <div className="absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2">
                      <Image
                        src="/assets/brand/logo/fly.png"
                        alt=""
                        fill
                        priority
                        quality={100}
                        sizes="(max-width: 768px) 320px, 430px"
                        className="object-contain"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    className="absolute inset-0 z-[3]"
                    animate={{
                      scale: [1, 1.03 + loadingProgress / 500, 1],
                    }}
                    transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      opacity: 0.55 + loadingProgress / 260,
                      filter: `drop-shadow(0 0 ${10 + loadingProgress * 0.18}px rgba(77, 184, 255, 0.85))`,
                    }}
                  >
                    <Image
                      src="/assets/brand/logo/blue-gems.png"
                      alt=""
                      fill
                      priority
                      quality={100}
                      sizes="(max-width: 768px) 420px, 500px"
                      className="object-contain"
                    />
                  </motion.div>

                  <motion.div
                    className="absolute inset-0"
                    initial={{ x: 120, y: -72, rotate: 8, opacity: 0, scale: 0.85 }}
                    animate={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.14 }}
                  >
                    <Image
                      src="/assets/brand/logo/tear2.png"
                      alt="Tear Fragment"
                      fill
                      priority
                      quality={100}
                      sizes="(max-width: 768px) 420px, 500px"
                      className="object-contain"
                    />
                  </motion.div>

                  <motion.div
                    className="absolute inset-0"
                    initial={{ y: 80, opacity: 0, scale: 0.75 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                  >
                    <Image
                      src="/assets/brand/logo/central.png"
                      alt="Central Sigil"
                      fill
                      priority
                      quality={100}
                      sizes="(max-width: 768px) 420px, 500px"
                      className="object-contain"
                    />
                  </motion.div>

                  <motion.div
                    className="pointer-events-none absolute inset-x-[2%] -bottom-[16%] z-[4] h-[38%]"
                    initial={{ opacity: 0, scale: 0.74, y: 22 }}
                    animate={{
                      opacity: introPhase === "loading" ? 0 : 1,
                      scale: [0.74, 1.16, 0.96],
                      y: [22, 0, 0],
                    }}
                    transition={{ duration: 1.15, times: [0, 0.62, 1], ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
                  >
                    <Image
                      src="/assets/brand/logo/game-title.png"
                      alt="Remnantborn The Last Tear"
                      fill
                      priority
                      quality={100}
                      sizes="(max-width: 768px) 380px, 460px"
                      className="object-contain"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>

              <div className="mt-8 flex flex-col items-center gap-5">
                {introPhase === "assembled" && (
                  <motion.button
                    type="button"
                    onClick={beginIntroTransition}
                    className="mt-3 rounded-full border border-[#86bfff]/60 bg-[#0b1326]/90 px-10 py-3.5 font-sans text-sm tracking-[0.2em] text-[#dfeeff] uppercase"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Begin
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {introPhase === "done" && (
        <>
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
          <nav className="relative flex items-center justify-between">
            {/* Left Nav */}
            <div className="hidden items-center gap-8 md:flex lg:gap-12">
              <a
                href="#about"
                onClick={(e) => handleSmoothScroll(e, 'about')}
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                About
              </a>
              <a
                href="#features"
                onClick={(e) => handleSmoothScroll(e, 'features')}
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                Game Features
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="text-[#D9D9D9] md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <motion.button
              type="button"
              onClick={handleScrollToTop}
              initial={{ opacity: 0, scale: 0.9, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Back to top"
              className="absolute left-1/2 top-1/2 hidden w-[10.5rem] -translate-x-1/2 -translate-y-1/2 cursor-pointer md:block"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Image
                src="/assets/brand/game-name.png"
                alt="Remnantborn The Last Tear"
                width={589}
                height={182}
                quality={100}
                sizes="168px"
                className="h-auto w-full object-contain"
              />
            </motion.button>

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
              <a
                href="#features"
                onClick={(e) => handleSmoothScroll(e, 'features')}
                className="cursor-pointer font-sans text-sm tracking-[0.2em] text-[#D9D9D9] uppercase transition-colors hover:text-[#FFFFFF]"
              >
                Game Features
              </a>
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
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </header>

        {/* Hero Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          {/* Official Game Name Branding */}
          <motion.div
            className="relative w-full max-w-[20rem] sm:max-w-[28rem] md:max-w-[34rem] lg:max-w-[40rem]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="brand-floating-glow">
              <Image
                src="/assets/brand/game-name.png"
                alt="Remnantborn The Last Tear"
                width={589}
                height={182}
                priority
                quality={100}
                sizes="(max-width: 640px) 320px, (max-width: 768px) 448px, (max-width: 1024px) 544px, 640px"
                className="h-auto w-full object-contain"
              />
            </div>
          </motion.div>

          {/* Tagline */}
          <p className="mt-6 font-sans text-xs tracking-[0.25em] text-[#A6A921] uppercase drop-shadow sm:text-sm md:mt-8 md:text-base">
            Fight the Remnants, Awaken Your True Power
          </p>

          {/* CTA Buttons */}
          <div className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:gap-8 md:mt-24 lg:mt-32 lg:gap-48">
            <MagneticButton
              className="min-w-[160px] rounded-[18px] border border-[#A6A921]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#D9D9D9] backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF]"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.78) 0%, rgba(40, 57, 26, 0.74) 52%, rgba(166, 169, 33, 0.28) 100%)',
              }}
            >
              Watch Trailer
            </MagneticButton>

            <MagneticButton
              className="min-w-[160px] rounded-[18px] border border-[#A6A921]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#D9D9D9] backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF]"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.78) 0%, rgba(40, 57, 26, 0.74) 52%, rgba(166, 169, 33, 0.28) 100%)',
              }}
            >
              Play Game
            </MagneticButton>
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
      <motion.section
        id="about"
        className="relative w-full bg-[#051312] py-16 md:py-24"
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
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
      </motion.section>

      {/* Discover Section */}
      <motion.section
        id="discover"
        className="relative overflow-hidden bg-[#051312] py-18 md:py-24"
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
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

          <motion.div
            className="relative mt-10 sm:mt-12"
            variants={staggerRevealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
          >
            <div className="film-strip-shell mx-auto w-full max-w-[1220px]">
            <div className="film-strip-perforation film-strip-perforation-top" aria-hidden="true" />

            <div className="film-strip-marquee group">
              <div className="film-strip-track">
                <div className="film-strip-reel">
                  {discoverFilmFrames.map((src, index) => (
                    <motion.article key={`reel-a-${index}`} className="film-frame" variants={sectionRevealVariants}>
                      <Image
                        src={src}
                        alt={`Discover frame ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 240px, (max-width: 1024px) 320px, 380px"
                        className="film-frame-image"
                      />
                    </motion.article>
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
          </motion.div>
        </div>
      </motion.section>

      {/* Remnant Fighters Section */}
      <motion.section
        id="fighters"
        className="relative overflow-hidden bg-[#051312] py-18 md:py-24"
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.18 }}
      >
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

            <motion.div
              className="relative z-[3] grid grid-cols-1 gap-12 md:grid-cols-2 xl:grid-cols-3 xl:gap-8"
              variants={staggerRevealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.24 }}
            >
              {remnantFighters.map((fighter) => (
                <motion.article
                  key={fighter.key}
                  className="fighter-card group relative mx-auto flex w-full max-w-[440px] flex-col items-center rounded-2xl border border-[#A6A921]/28 bg-[linear-gradient(180deg,rgba(5,19,18,0.55)_0%,rgba(5,19,18,0.3)_100%)] px-4 pb-5 pt-3 text-center will-change-transform"
                  variants={fighterCardVariants}
                  whileHover="hover"
                  onMouseMove={(event) => handleFighterMouseMove(fighter.key, event)}
                  onMouseLeave={() => resetFighterParallax(fighter.key)}
                >
                  <div className="fighter-card-trace" aria-hidden="true">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="fighter-card-trace-svg">
                      <rect x="1.2" y="1.2" width="97.6" height="97.6" rx="6.5" ry="6.5" pathLength="1000" className="fighter-card-trace-rail" />
                      <rect x="1.2" y="1.2" width="97.6" height="97.6" rx="6.5" ry="6.5" pathLength="1000" className="fighter-card-trace-runner" />
                    </svg>
                  </div>

                  <motion.div
                    className={`pointer-events-none absolute bottom-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full blur-2xl ${fighter.auraClass}`}
                    variants={fighterAuraVariants}
                    style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
                  />

                  <div
                    className="relative h-[240px] w-[190px] transition-transform duration-200 ease-out will-change-transform"
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
                </motion.article>
              ))}
            </motion.div>

            <div className="fighter-fog fighter-fog-front" aria-hidden="true" />
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        id="features"
        className="relative overflow-hidden bg-[#051312] py-18 md:py-24"
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <motion.h2 className="mt-3 text-center font-sans text-3xl font-normal tracking-[0.15em] text-[#CCAE68] uppercase md:mt-4 md:text-4xl lg:mt-5 lg:text-5xl" variants={sectionRevealVariants}>
            Gameplay Features
          </motion.h2>
          <motion.p className="mx-auto mt-8 max-w-3xl text-center font-sans text-[14px] leading-[1.6] tracking-[0.035em] text-[#D9D9D9] uppercase md:text-[15px]" variants={sectionRevealVariants}>
            Enter reactive battlegrounds where relic power, timing mastery, and tactical movement define every clash.
          </motion.p>

          <motion.div
            className="mt-11 grid grid-cols-1 gap-6 md:grid-cols-2"
            variants={staggerRevealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
          >
            {gameplayFeatures.map((feature) => (
              <GameplayTiltCard key={feature.title} title={feature.title} description={feature.description} />
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Community Section + Footer */}
      <motion.section
        id="community"
        className="relative w-full overflow-hidden border-t border-[#A6A921]/35"
        variants={sectionRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
      >
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
            <MagneticButton
              className="mt-8 min-w-[160px] rounded-[18px] border border-[#A6A921]/50 px-8 py-3 font-sans text-[13px] font-normal tracking-[0.15em] text-[#D9D9D9] backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF] md:mt-12"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.78) 0%, rgba(40, 57, 26, 0.74) 52%, rgba(166, 169, 33, 0.28) 100%)',
              }}
              onClick={() => window.location.href = "/login"}
            >
              Join Community
            </MagneticButton>
          </div>

          <footer className="mt-16 md:mt-24">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-end">
              <div className="text-center md:text-left">
                <motion.button
                  type="button"
                  onClick={handleScrollToTop}
                  aria-label="Back to top"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="brand-floating-glow mx-auto block w-[18.75rem] cursor-pointer md:mx-0 md:w-[22.5rem]"
                >
                  <Image
                    src="/assets/brand/game-name.png"
                    alt="Remnantborn The Last Tear"
                    width={589}
                    height={182}
                    quality={100}
                    sizes="(max-width: 768px) 300px, (max-width: 1024px) 360px, 420px"
                    className="h-auto w-full object-contain"
                  />
                </motion.button>
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
      </motion.section>

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
            <MagneticButton
              className="rounded-l-[18px] border border-r-0 border-[#A6A921]/50 px-6 py-4 font-sans text-[12px] font-normal tracking-[0.15em] text-[#D9D9D9] uppercase shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-[#CCAE68] hover:text-[#FFFFFF]"
              style={{
                background: 'linear-gradient(145deg, rgba(5, 19, 18, 0.9) 0%, rgba(40, 57, 26, 0.86) 52%, rgba(166, 169, 33, 0.36) 100%)',
              }}
            >
              Play Game<br />Now
            </MagneticButton>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  )
}
