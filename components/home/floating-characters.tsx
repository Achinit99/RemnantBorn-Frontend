"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

const storageUrl = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ?? "").replace(/\/$/, "")
const withStorage = (assetPath: string) => `${storageUrl}${assetPath}`

type FloatingCharacterConfig = {
  id: string
  src: string
  top: string
  left: string
  width: number
  baseOpacity: number
  yDrift: number
  rotationDrift: number
  duration: number
  delay: number
}

const CHARACTERS: FloatingCharacterConfig[] = [
  {
    id: "lira",
    src: withStorage("/assets/fighters/Lira.png"),
    top: "14%",
    left: "6%",
    width: 220,
    baseOpacity: 0.42,
    yDrift: 18,
    rotationDrift: 2.4,
    duration: 8.5,
    delay: 0.2,
  },
  {
    id: "kade",
    src: withStorage("/assets/fighters/Kade.png"),
    top: "57%",
    left: "38%",
    width: 250,
    baseOpacity: 0.4,
    yDrift: 20,
    rotationDrift: 2.2,
    duration: 10.2,
    delay: 0.5,
  },
]

type CursorPoint = { x: number; y: number }
type ViewportSize = { width: number; height: number }

function percentToPx(value: string, max: number) {
  const numeric = Number.parseFloat(value)
  return Number.isNaN(numeric) ? 0 : (numeric / 100) * max
}

function getProximityBoost(cursor: CursorPoint | null, centerX: number, centerY: number) {
  if (!cursor) {
    return 0
  }

  const dx = cursor.x - centerX
  const dy = cursor.y - centerY
  const distance = Math.hypot(dx, dy)

  if (distance >= 260) {
    return 0
  }

  return 1 - distance / 260
}

export function FloatingCharacters() {
  const [cursor, setCursor] = useState<CursorPoint | null>(null)
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 })

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }

    const handleMouseMove = (event: MouseEvent) => {
      setCursor({ x: event.clientX, y: event.clientY })
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("resize", updateViewport)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  const charactersWithBoost = useMemo(() => {
    return CHARACTERS.map((character) => {
      const centerX = percentToPx(character.left, viewport.width) + character.width / 2
      const centerY = percentToPx(character.top, viewport.height) + character.width / 2
      const boost = getProximityBoost(cursor, centerX, centerY)

      return { character, boost }
    })
  }, [cursor, viewport])

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] hidden h-screen w-full overflow-visible sm:block" aria-hidden="true">
      {charactersWithBoost.map(({ character, boost }) => {
        const opacity = Math.min(0.7, character.baseOpacity + boost * 0.22)
        const filter = boost > 0.08
          ? `drop-shadow(0 0 ${6 + boost * 14}px rgba(204,174,104,0.45))`
          : "none"

        return (
          <motion.div
            key={character.id}
            className="absolute"
            style={{ top: character.top, left: character.left, width: character.width, opacity, filter }}
            animate={{
              y: [0, -character.yDrift, 0],
              rotate: [0, character.rotationDrift, 0, -character.rotationDrift, 0],
            }}
            transition={{
              duration: character.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: character.delay,
            }}
          >
            <Image
              src={character.src}
              alt=""
              width={character.width}
              height={Math.round(character.width * 1.35)}
              sizes="(max-width: 640px) 0px, (max-width: 1024px) 160px, 230px"
              className="h-auto w-full object-contain"
              priority={false}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
