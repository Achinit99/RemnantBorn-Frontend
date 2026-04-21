"use client"

import Image from "next/image"
import { motion } from "framer-motion"

const handDustParticles = [
  { x: 0, driftX: -18, delay: 0, duration: 2.2, size: 5, opacity: 1 },
  { x: 6, driftX: -12, delay: 0.2, duration: 2.4, size: 4, opacity: 0.95 },
  { x: -4, driftX: -22, delay: 0.45, duration: 2.6, size: 4, opacity: 0.9 },
  { x: 10, driftX: -16, delay: 0.75, duration: 2.8, size: 3, opacity: 0.85 },
  { x: -7, driftX: -25, delay: 1.05, duration: 2.5, size: 4, opacity: 0.9 },
  { x: 4, driftX: -14, delay: 1.35, duration: 2.7, size: 3, opacity: 0.8 },
  { x: -2, driftX: -20, delay: 1.65, duration: 2.9, size: 3, opacity: 0.75 },
  { x: 9, driftX: -15, delay: 1.9, duration: 3, size: 2, opacity: 0.7 },
]

export function FightRemnantsCharacterGroup() {
  return (
    <div className="relative isolate mx-auto w-full max-w-[430px] lg:mx-0 lg:max-w-[490px]">
      <div className="absolute left-[10%] right-[18%] bottom-[14%] h-28 rounded-full bg-[#d4af37]/20 blur-3xl" aria-hidden="true" />

      <div className="relative aspect-[4/5] w-full overflow-visible lg:translate-y-2">
        <motion.div
          className="absolute inset-0 origin-center will-change-transform"
          animate={{ y: [0, -16, -10, 0] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        >
          <div className="absolute inset-0">
            <div className="relative h-full w-full translate-x-[-8%] translate-y-[14%] sm:translate-x-[-6%]">
              <Image
                src="/assets/characters/attack-rock.png"
                alt="Attack rock"
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-contain object-left-bottom"
              />
            </div>
          </div>

          <div className="absolute inset-0">
            <motion.div
              className="relative h-full w-full scale-[1.18] translate-x-[1%] translate-y-[0%] sm:scale-[1.22] sm:translate-x-[0%] sm:translate-y-[-1%]"
              animate={{ rotate: [-9, -12, -9] }}
              transition={{ duration: 4.4, ease: "easeInOut", repeat: Infinity }}
              style={{ transformOrigin: "38% 76%" }}
            >
              <Image
                src="/assets/characters/boy-floting.png"
                alt="Boy attacking from the rock"
                fill
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-contain object-left-bottom"
              />
            </motion.div>
          </div>

          <motion.div
            className="absolute inset-0"
            animate={{ y: [0, -42, -62, -46, 0] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          >
            <div className="relative h-full w-full translate-x-[10%] translate-y-[-22%] sm:translate-x-[11%] sm:translate-y-[-24%]">
              <Image
                src="/assets/characters/girl_body.png"
                alt="Girl body"
                fill
                sizes="(max-width: 1024px) 90vw, 480px"
                className="object-contain object-left-bottom"
              />

              <motion.div
                className="relative h-full w-full"
                animate={{ rotate: [-0.7, 1.1, -0.7] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                style={{ transformOrigin: "18% 24%" }}
              >
                <Image
                  src="/assets/characters/girl-arm.png"
                  alt="The Girl arm and staff"
                  fill
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="object-contain object-left-bottom"
                />

                <div
                  className="pointer-events-none absolute left-[63%] top-[21%] h-8 w-8 -translate-x-1/2 -translate-y-1/2 overflow-visible"
                  aria-hidden="true"
                >
                  {handDustParticles.map((particle, index) => (
                    <motion.span
                      key={`dust-${index}`}
                      className="absolute rounded-full"
                      initial={{
                        x: particle.x,
                        y: 0,
                        opacity: 0,
                        scale: 1,
                      }}
                      animate={{
                        x: [particle.x, particle.x + particle.driftX],
                        y: [0, 275],
                        opacity: [0, particle.opacity, particle.opacity * 0.75, 0],
                        scale: [1, 0.75, 0.2],
                      }}
                      transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        ease: "easeOut",
                        repeat: Infinity,
                        repeatDelay: 0.15,
                      }}
                      style={{
                        left: "50%",
                        top: "0%",
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        background:
                          "radial-gradient(circle, rgba(255,236,174,1) 0%, rgba(212,175,55,0.95) 45%, rgba(212,175,55,0) 100%)",
                        boxShadow: "0 0 12px rgba(212,175,55,0.7)",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}