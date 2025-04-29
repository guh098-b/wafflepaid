"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { sendMessage } from "./actions/send-message"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Globe, Key, Shield, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ParallaxElement } from "./components/parallax-element"
import { FloatingElements } from "./components/floating-elements"
import { ParaalaxElement } from "./components/ParaalaxElement"
import { useNotification } from "./components/notification-container"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [key, setKey] = useState("")
  const [keyStatus, setKeyStatus] = useState<"idle" | "valid" | "invalid" | "security">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { showNotification } = useNotification()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      console.log("Submitting key...")
      const result = await sendMessage(formData)
      console.log("Server action response:", result)

      if (result.success) {
        // Check if this is the admin key
        if (result.isAdmin) {
          showNotification("success", "Admin access granted! Redirecting...", 3000)
          setKeyStatus("valid")

          // Use window.location for a full page reload to ensure cookies are applied
          setTimeout(() => {
            window.location.href = "/dashboard/admin"
          }, 1500)
        } else {
          showNotification("success", "Key accepted! Redirecting to dashboard...", 3000)
          setKey("")
          setKeyStatus("valid")

          // Use window.location for a full page reload to ensure cookies are applied
          setTimeout(() => {
            window.location.href = "/dashboard"
          }, 1500)
        }
      } else {
        // Check if this is a security alert
        if (result.error?.includes("Security alert")) {
          setKeyStatus("security")
          setErrorMessage(result.error)
          showNotification("error", "Security Alert: Key is registered to a different IP address", 5000)
        } else if (result.error === "Invalid key") {
          setKeyStatus("invalid")
          showNotification("error", "Invalid key. Please try again.", 3000)
        } else {
          setKeyStatus("idle")
          showNotification("warning", result.error || "An error occurred", 4000)
        }
      }
    } catch (error) {
      console.error("Error submitting key:", error)
      showNotification("error", "An unexpected error occurred.", 4000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscordSupport = () => {
    window.open("https://discord.gg/BzBZRvjF3x", "_blank")
    showNotification("info", "Opening Discord support server...", 2000)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <FloatingElements />

      <ParallaxElement speed={0.2} direction="down" className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight mb-2">
            Waffle Proxy <span className="text-red-600">PAID</span>
          </h1>
          <p className="text-black/60 max-w-md mx-auto">Enter your key given when buying paid access</p>
        </div>
      </ParallaxElement>

      <ParallaxElement speed={0.1} direction="up">
        <Card className="w-full max-w-md bg-black/5 border-black/10">
          <CardHeader className="border-b border-black/10">
            <CardTitle className="text-2xl text-black">Access Control</CardTitle>
            <CardDescription className="flex items-center gap-1 text-black/60">
              <Globe className="h-3 w-3" />
              Enter a valid key to access page
            </CardDescription>
          </CardHeader>
          <form action={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="key" className="text-black/80">
                  Access Key
                </Label>
                <div className="relative">
                  <Input
                    id="key"
                    name="key"
                    placeholder="Enter your access key..."
                    value={key}
                    onChange={(e) => {
                      setKey(e.target.value)
                      setKeyStatus("idle")
                      setErrorMessage(null)
                    }}
                    className={`pl-9 bg-white border-black/10 text-black placeholder:text-black/40 ${
                      keyStatus === "valid"
                        ? "border-green-500/70 focus-visible:ring-green-500/50"
                        : keyStatus === "invalid" || keyStatus === "security"
                          ? "border-red-500/70 focus-visible:ring-red-500/50"
                          : "focus-visible:ring-black/30"
                    }`}
                    required
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
                  {(keyStatus === "invalid" || keyStatus === "security") && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                  )}
                </div>
                {keyStatus === "invalid" && <p className="text-sm text-red-400">Invalid key.</p>}
                {keyStatus === "security" && (
                  <Alert variant="destructive" className="mt-2 bg-red-100 border-red-300 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t border-black/10 pt-4">
              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90 text-white border-none"
                disabled={isLoading || !key.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="mr-2">Validating...</span>
                    <span className="animate-spin">
                      <Key className="h-4 w-4" />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">Submit Key</span>
                    <Shield className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </ParallaxElement>

      <ParallaxElement speed={0.15} direction="up" className="mt-6">
        <Button
          onClick={handleDiscordSupport}
          className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-none flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Join our Discord server!</span>
        </Button>
      </ParallaxElement>

      <ParaalaxElement />
    </main>
  )
}
