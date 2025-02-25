"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export const FloatingParticles = () => {
  const [particles, setParticles] = useState<{ x: number; y: number; size: number }[]>([])

  useEffect(() => {
    const particleCount = 30
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-blue-500/5 to-purple-500/5"
          style={{
            width: particle.size,
            height: particle.size,
          }}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            scale: 0,
          }}
          animate={{
            x: [`${particle.x}%`, `${(particle.x + 10) % 100}%`],
            y: [`${particle.y}%`, `${(particle.y + 10) % 100}%`],
            scale: [0, 1, 0],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 1],
          }}
        />
      ))}
    </div>
  )
}

