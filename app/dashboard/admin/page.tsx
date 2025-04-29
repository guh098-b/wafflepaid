"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addKey, getKeys, extendKey, revokeKeyAction } from "../../actions/send-message"
import { Copy, Key, Plus, Shield, Clock, Trash2, RefreshCw, LogOut } from "lucide-react"
import { ParallaxElement } from "../../components/parallax-element"
import { FloatingElements } from "../../components/floating-elements"
import { formatRemainingTime } from "../../lib/key-store"

export default function AdminPage() {
  const [newKey, setNewKey] = useState("")
  const [expirationHours, setExpirationHours] = useState("24")
  const [isLoading, setIsLoading] = useState(false)
  const [keys, setKeys] = useState<Array<{ key: string; data: any }>>([])
  const [isLoadingKeys, setIsLoadingKeys] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadKeys() {
      try {
        const result = await getKeys()
        if (result.success) {
          setKeys(result.keys)
        } else {
          router.push("/")
          toast({
            title: "Unauthorized",
            description: "You don't have permission to access this page",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to load keys:", error)
        toast({
          title: "Error",
          description: "Failed to load existing keys",
          variant: "destructive",
        })
      } finally {
        setIsLoadingKeys(false)
      }
    }

    loadKeys()
  }, [toast, router])

  async function handleAddKey(formData: FormData) {
    setIsLoading(true)

    try {
      const result = await addKey(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        })
        setNewKey("")
        setKeys(result.keys)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleExtendKey(key: string) {
    try {
      const formData = new FormData()
      formData.append("key", key)
      formData.append("hours", "24")

      const result = await extendKey(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        })
        setKeys(result.keys)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to extend key",
        variant: "destructive",
      })
    }
  }

  async function handleRevokeKey(key: string) {
    try {
      const formData = new FormData()
      formData.append("key", key)

      const result = await revokeKeyAction(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        })
        setKeys(result.keys)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke key",
        variant: "destructive",
      })
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: "Key copied to clipboard",
          variant: "default",
        })
      },
      (err) => {
        console.error("Could not copy text: ", err)
      },
    )
  }

  const handleLogout = () => {
    document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    router.push("/")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-white">
      <FloatingElements />

      <ParallaxElement speed={0.2} direction="down" className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-black tracking-tight mb-2">Admin Control Panel</h1>
          <p className="text-black/60 max-w-md mx-auto">Manage access keys and security settings</p>
        </div>
      </ParallaxElement>

      <ParallaxElement speed={0.1} direction="up">
        <Card className="w-full max-w-md bg-black/5 border-black/10">
          <CardHeader className="bg-white border-b border-black/10">
            <CardTitle className="text-2xl text-black flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Panel
            </CardTitle>
            <CardDescription className="text-gray-600">Manage access keys for your application</CardDescription>
          </CardHeader>
          <form action={handleAddKey}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="newKey" className="text-black/80">
                  Add New Key
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="newKey"
                      name="newKey"
                      placeholder="Enter new access key..."
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="pl-9 bg-white border-black/10 text-black placeholder:text-black/40"
                      required
                    />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
                  </div>
                  <div className="w-24">
                    <Input
                      id="expirationHours"
                      name="expirationHours"
                      type="number"
                      placeholder="Hours"
                      value={expirationHours}
                      onChange={(e) => setExpirationHours(e.target.value)}
                      className="bg-white border-black/10 text-black placeholder:text-black/40"
                      min="1"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !newKey.trim()}
                    className="bg-black hover:bg-black/90 text-white border-none"
                  >
                    {isLoading ? (
                      <span className="animate-spin">
                        <Plus className="h-4 w-4" />
                      </span>
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-black/80">Existing Keys</Label>
                {isLoadingKeys ? (
                  <div className="text-center py-4 text-black/50">Loading keys...</div>
                ) : keys.length === 0 ? (
                  <div className="text-center py-4 text-black/50">No custom keys added yet</div>
                ) : (
                  <div className="border border-black/10 rounded-md divide-y divide-black/10">
                    {keys.map((keyItem) => (
                      <div key={keyItem.key} className="flex items-center justify-between p-2 hover:bg-black/5">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-black/80">{keyItem.key}</div>
                          {keyItem.data.expiresAt && (
                            <div className="text-xs text-black/50 flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatRemainingTime(Math.max(0, keyItem.data.expiresAt - Date.now()))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExtendKey(keyItem.key)}
                            className="h-8 w-8 text-black/60 hover:text-black hover:bg-black/10"
                            title="Extend by 24 hours"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(keyItem.key)}
                            className="h-8 w-8 text-black/60 hover:text-black hover:bg-black/10"
                            title="Copy key"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeKey(keyItem.key)}
                            className="h-8 w-8 text-black/60 hover:text-red-600 hover:bg-black/10"
                            title="Revoke key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-black/10 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-black/10 text-black/80 hover:bg-black/10 hover:text-black"
              >
                Back to Login
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-black/10 text-black/80 hover:bg-black/10 hover:text-black"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardFooter>
          </form>
        </Card>
      </ParallaxElement>
    </main>
  )
}
