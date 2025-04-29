"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

export function MirrorEffect({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      // Calculate mouse position relative to the container
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      setMousePosition({ x, y })

      // Update mirror reflection based on mouse position
      if (mirrorRef.current) {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01
        mirrorRef.current.style.transform = `perspective(1000px) rotateX(${-moveY}deg) rotateY(${moveX}deg) translateZ(0px)`
      }
    }

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Calculate reflection and lighting effects based on mouse position
  const reflectionStyle = {
    backgroundImage: `
    radial-gradient(
      circle at ${mousePosition.x}% ${mousePosition.y}%, 
      rgba(255, 255, 255, 0.15) 0%, 
      rgba(255, 255, 255, 0.05) 25%, 
      rgba(255, 255, 255, 0.02) 50%,
      rgba(0, 0, 0, 0.1) 75%
    ),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      rgba(0, 0, 0, 0.1) 100%
    )
  `,
    backgroundAttachment: "fixed",
    boxShadow: `
    0 4px 30px rgba(0, 0, 0, 0.2),
    inset 0 0 20px rgba(255, 255, 255, 0.1)
  `,
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen overflow-hidden"
      style={{
        perspective: "1000px",
        perspectiveOrigin: "center",
      }}
    >
      {/* Mirror background with reflection */}
      <div
        ref={mirrorRef}
        className="absolute inset-0 transition-transform duration-200 ease-out"
        style={{
          ...reflectionStyle,
          transform: `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`,
        }}
      />

      {/* Glass overlay with blur */}
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Content with parallax effect */}
      <div className="relative z-10">{children}</div>

      {/* Mouse reflection overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(
      circle at ${mousePosition.x}% ${mousePosition.y}%, 
      rgba(255, 255, 255, 0.2) 0%, 
      rgba(255, 255, 255, 0) 20%
    )`,
          mixBlendMode: "overlay",
          transition: "all 0.1s ease-out",
        }}
      />

      {/* Mouse shadow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(
      circle at ${mousePosition.x}% ${mousePosition.y}%, 
      rgba(0, 0, 0, 0.1) 0%, 
      rgba(0, 0, 0, 0) 30%
    )`,
          mixBlendMode: "multiply",
          transition: "all 0.1s ease-out",
        }}
      />
    </div>
  )
}
