"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export type NotificationType = "success" | "info" | "warning" | "error"

interface NotificationProps {
  id: string
  type: NotificationType
  message: string
  duration?: number
  onClose: (id: string) => void
}

const getBackgroundColor = (type: NotificationType): string => {
  switch (type) {
    case "success":
      return "bg-green-500"
    case "info":
      return "bg-blue-500"
    case "warning":
      return "bg-orange-500"
    case "error":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getTextColor = (type: NotificationType): string => {
  return "text-white"
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case "success":
      return <CheckCircle size={18} />
    case "info":
      return <Info size={18} />
    case "warning":
      return <AlertTriangle size={18} />
    case "error":
      return <AlertCircle size={18} />
    default:
      return <Info size={18} />
  }
}

export const Notification = ({ id, type, message, duration = 5000, onClose }: NotificationProps) => {
  const [progress, setProgress] = useState(100)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const stepMs = 10
  const step = (stepMs / duration) * 100

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress <= step) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return prevProgress - step
      })
    }, stepMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [id, duration, step])

  useEffect(() => {
    if (progress === 0) {
      const timeout = setTimeout(() => {
        onClose(id)
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [progress, id, onClose])

  const handleClose = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    onClose(id)
  }

  const textColor = getTextColor(type)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-md shadow-lg ${getBackgroundColor(
        type,
      )} ${textColor} backdrop-blur-sm max-w-xs`}
      style={{
        backgroundColor:
          type === "success"
            ? "rgba(34, 197, 94, 0.9)"
            : type === "info"
              ? "rgba(59, 130, 246, 0.9)"
              : type === "warning"
                ? "rgba(249, 115, 22, 0.9)"
                : "rgba(239, 68, 68, 0.9)",
      }}
    >
      <div className="p-4 pr-8">
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 text-white">{getIcon(type)}</span>
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/80 hover:text-white"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
      <div className="h-1 w-full bg-black/10">
        <div className="h-full bg-white/30" style={{ width: `${progress}%`, transition: "width 10ms linear" }} />
      </div>
    </motion.div>
  )
}
