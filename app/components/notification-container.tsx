"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { Notification, type NotificationType } from "./notification"
import { createPortal } from "react-dom"

interface NotificationItem {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const showNotification = useCallback((type: NotificationType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { id, type, message, duration }])
  }, [])

  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const notificationContainer = (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            id={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration}
            onClose={closeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  )

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {isMounted && createPortal(notificationContainer, document.body)}
    </NotificationContext.Provider>
  )
}
