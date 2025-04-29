"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface ParallaxElementProps {
  children: React.ReactNode
  speed?: number
  className?: string
  mouseIntensity?: number
  direction?: "up" | "down"
}

export function ParallaxElement({
  children,
  speed = 0.5,
  className = "",
  mouseIntensity = 0.02,
  direction = "up",
}: ParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  // Adjust direction of parallax effect
  const multiplier = direction === "up" ? -1 : 1
  const y = useTransform(scrollYProgress, [0, 1], [0, speed * 100 * multiplier])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position relative to center of screen
      const x = (e.clientX - window.innerWidth / 2) * mouseIntensity
      const y = (e.clientY - window.innerHeight / 2) * mouseIntensity

      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [mouseIntensity])

  return (
    <motion.div
      ref={ref}
      className={`${className}`}
      style={{
        y: y,
        x: mousePosition.x,
        translateY: mousePosition.y,
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  )
}
