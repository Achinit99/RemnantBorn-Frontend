"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type DustParticle = {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  size: number
  duration: number
}

interface MagicDustCardProps {
  children: React.ReactNode
  className?: string
  particleCount?: number
}

const DEFAULT_PARTICLE_COUNT = 28
const MAX_ACTIVE_PARTICLES = 260

function randomFrom(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function MagicDustCard({ children, className, particleCount = DEFAULT_PARTICLE_COUNT }: MagicDustCardProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const nextParticleIdRef = useRef(0)
  const [particles, setParticles] = useState<DustParticle[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })

  const removeParticleById = useCallback((id: number) => {
    setParticles((currentParticles) => currentParticles.filter((particle) => particle.id !== id))
  }, [])

  const spawnParticleBurst = useCallback(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    const rect = host.getBoundingClientRect()
    const nextParticles: DustParticle[] = []

    for (let index = 0; index < particleCount; index += 1) {
      const edge = Math.floor(Math.random() * 4)
      let x = 0
      let y = 0

      if (edge === 0) {
        x = randomFrom(8, rect.width - 8)
        y = randomFrom(4, 12)
      } else if (edge === 1) {
        x = randomFrom(rect.width - 12, rect.width - 4)
        y = randomFrom(8, rect.height - 8)
      } else if (edge === 2) {
        x = randomFrom(8, rect.width - 8)
        y = randomFrom(rect.height - 12, rect.height - 4)
      } else {
        x = randomFrom(4, 12)
        y = randomFrom(8, rect.height - 8)
      }

      const particle: DustParticle = {
        id: nextParticleIdRef.current,
        x,
        y,
        dx: randomFrom(-36, 36),
        dy: randomFrom(-42, 32),
        size: randomFrom(2.8, 6.8),
        duration: randomFrom(1.65, 2.7),
      }

      nextParticleIdRef.current += 1
      nextParticles.push(particle)

      window.setTimeout(() => {
        removeParticleById(particle.id)
      }, Math.ceil(particle.duration * 1000) + 60)
    }

    setParticles((currentParticles) => {
      const mergedParticles = [...currentParticles, ...nextParticles]
      if (mergedParticles.length <= MAX_ACTIVE_PARTICLES) {
        return mergedParticles
      }

      return mergedParticles.slice(mergedParticles.length - MAX_ACTIVE_PARTICLES)
    })
  }, [particleCount, removeParticleById])

  const handleMouseEnter = () => {
    setIsHovered(true)
    spawnParticleBurst()
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ rotateX: 0, rotateY: 0 })
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const host = hostRef.current
    if (!host) {
      return
    }

    const rect = host.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height

    const rotateY = (relativeX - 0.5) * 6
    const rotateX = (0.5 - relativeY) * 6

    setTilt({ rotateX, rotateY })
  }

  return (
    <motion.div
      ref={hostRef}
      className={cn("relative", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered
          ? "0 20px 50px rgba(0,0,0,0.82), 0 0 20px rgba(255,215,0,0.4)"
          : "0 20px 50px rgba(0,0,0,0.8)",
      }}
      transition={{ type: "spring", stiffness: 180, damping: 18, mass: 0.8 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{ opacity: isHovered ? [0.25, 0.85, 0.35] : 0.2 }}
        transition={{ duration: 1.4, repeat: isHovered ? Infinity : 0, ease: "easeInOut" }}
        style={{ boxShadow: "inset 0 0 0 1px rgba(255, 215, 0, 0.28), 0 0 18px rgba(255, 215, 0, 0.25)" }}
      />

      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="pointer-events-none absolute rounded-full bg-[#ffd96d]"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              boxShadow: "0 0 14px rgba(255, 215, 0, 0.8), 0 0 24px rgba(255, 215, 0, 0.72)",
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 0],
              x: particle.dx,
              y: particle.dy,
              scale: [0.8, 1, 0.65],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: particle.duration, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
