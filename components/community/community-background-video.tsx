"use client"

import { useEffect, useRef } from "react"

const CINEMATIC_PLAYBACK_RATE = 0.5
const storageUrl = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ?? "").replace(/\/$/, "")
const withStorage = (assetPath: string) => `${storageUrl}${assetPath}`

export function CommunityBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const applyPlaybackRate = () => {
      video.defaultPlaybackRate = CINEMATIC_PLAYBACK_RATE
      video.playbackRate = CINEMATIC_PLAYBACK_RATE
    }

    applyPlaybackRate()
    video.addEventListener("loadedmetadata", applyPlaybackRate)

    return () => {
      video.removeEventListener("loadedmetadata", applyPlaybackRate)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden will-change-transform" aria-hidden>
      <video
        ref={videoRef}
        className="h-screen w-screen object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
      >
        <source src={withStorage("/videos/bg-video.mp4")} type="video/mp4" />
      </video>
    </div>
  )
}
