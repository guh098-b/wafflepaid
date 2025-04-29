"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Shield, Key, Lock, Fingerprint, Globe } from "lucide-react"

export function FloatingElements() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const elements = [
    {
      icon: <Shield className="w-8 h-8 text-black/10" />,
      x: "10%",
      y: "20%",
      duration: 20,
    },
    {
      icon: <Key className="w-6 h-6 text-black/10" />,
      x: "80%",
      y: "15%",
      duration: 15,
    },
    {
      icon: <Lock className="w-10 h-10 text-black/10" />,
      x: "30%",
      y: "70%",
      duration: 25,
    },
    {
      icon: <Fingerprint className="w-12 h-12 text-black/10" />,
      x: "70%",
      y: "60%",
      duration: 30,
    },
    {
      icon: <Globe className="w-7 h-7 text-black/10" />,
      x: "20%",
      y: "40%",
      duration: 18,
    },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {elements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{
            x: `${element.x}`,
            y: `${element.y}`,
            opacity: 0,
          }}
          animate={{
            y: [`${element.y}`, `calc(${element.y} - 50px)`, `${element.y}`],
            opacity: 0.7,
          }}
          transition={{
            y: {
              duration: element.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            },
            opacity: { duration: 1 },
          }}
        >
          {element.icon}
        </motion.div>
      ))}
    </div>
  )
}
