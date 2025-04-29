"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ParallaxElement } from "../components/parallax-element"
import { FloatingElements } from "../components/floating-elements"
import { Key, LogOut, Shield, Timer, Globe } from "lucide-react"
import { formatRemainingTime } from "../lib/key-store"
import { useNotification } from "../components/notification-container"

export default function Dashboard() {
  const [keyInfo, setKeyInfo] = useState<{
    key: string
    remainingTime: string
    remainingMs: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [proxyUrl, setProxyUrl] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { showNotification } = useNotification()
  const welcomeShownRef = useRef(false)

  useEffect(() => {
    // Get key from cookie (this is just for display, actual validation happens server-side)
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
      return null
    }

    const key = getCookieValue("key_session")

    if (!key) {
      router.push("/")
      return
    }

    // Show welcome notification only once
    if (!welcomeShownRef.current) {
      showNotification("info", "Welcome to the dashboard!", 3000)
      welcomeShownRef.current = true
    }

    // In a real app, we'd fetch this from the server
    // For now, we'll simulate it with client-side code
    const updateRemainingTime = () => {
      const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - (Date.now() % (24 * 60 * 60 * 1000)))
      const remainingTime = formatRemainingTime(remainingMs)

      setKeyInfo({
        key,
        remainingTime,
        remainingMs,
      })
    }

    updateRemainingTime()
    setLoading(false)

    // Update the remaining time every second
    const interval = setInterval(updateRemainingTime, 1000)

    return () => clearInterval(interval)
  }, [router, showNotification])

  const handleLogout = () => {
    // Clear cookies and redirect to home
    document.cookie = "key_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    showNotification("info", "Logging out...", 2000)
    setTimeout(() => {
      router.push("/")
    }, 500)
  }

  const handleProxySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proxyUrl) return

    // In a real app, this would connect to an Ultraviolet proxy
    // For this demo, we'll just show a notification
    showNotification("success", `Connecting to: ${proxyUrl}`, 3000)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <FloatingElements />

      <ParallaxElement speed={0.2} direction="down" className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight mb-2">Key Dashboard</h1>
          <p className="text-black/60 max-w-md mx-auto">Monitor your key status and expiration time</p>
        </div>
      </ParallaxElement>

      <ParallaxElement speed={0.1} direction="up">
        <Card className="w-full max-w-md bg-black/5 border-black/10">
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-2xl text-black flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Key Status
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-black/60">
              <Key className="h-3 w-3" />
              {loading ? "Loading key information..." : `Key: ${keyInfo?.key}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin">
                  <Timer className="h-8 w-8 text-black/60" />
                </div>
              </div>
            ) : (
              <>
                {/* Time remaining has been removed */}

                <div className="rounded-md bg-black/5 p-4 border border-black/10">
                  <h3 className="text-black font-medium mb-2">Key Information</h3>
                  <ul className="space-y-1 text-sm text-black/70">
                    <li>• This key is tied to your current IP address.</li>
                    <li>• Do not give your friends this key.</li>
                    <li>• Using this key from another IP will get your key deleted!</li>
                  </ul>
                </div>

                {/* Ultraviolet Proxy Form */}
                <form onSubmit={handleProxySubmit} className="space-y-3">
                  <div>
                    <label htmlFor="proxy-url" className="block text-sm font-medium text-black/80 mb-1">
                      Proxy
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="proxy-url"
                          placeholder="Enter URL to proxy..."
                          value={proxyUrl}
                          onChange={(e) => setProxyUrl(e.target.value)}
                          className="pl-9 bg-white border-black/10 text-black placeholder:text-black/40"
                        />
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
                      </div>
                      <Button
                        type="submit"
                        size="default"
                        disabled={!proxyUrl.trim()}
                        className="bg-black hover:bg-black/90 text-white border-none"
                      >
                        Go
                      </Button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </CardContent>
          <CardFooter className="border-t border-black/10 pt-4">
            <Button onClick={handleLogout} className="w-full bg-black hover:bg-black/90 text-white border-none">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardFooter>
        </Card>
      </ParallaxElement>
    </main>
  )
}
