"use server"

import { headers } from "next/headers"
import {
  isValidKey,
  isAdminKey,
  registerKeyWithIp,
  isKeyAllowedForIp,
  getRegisteredIpForKey,
  addCustomKey,
  getAllKeys,
  getKeyRemainingTime,
  formatRemainingTime,
  extendKeyExpiration,
  revokeKey,
} from "../lib/key-store"
import { cookies } from "next/headers"

const ADMIN_SESSION_DURATION = 15 * 60 * 1000

export async function sendMessage(formData: FormData) {
  const key = formData.get("key")
  console.log("Processing key:", key)

  // Get client IP from headers - this is the user's public IP
  const headersList = headers()
  const ipAddress = getClientIp(headersList) || "Unknown IP"
  console.log("User IP address:", ipAddress)

  if (!key || typeof key !== "string") {
    return { success: false, error: "Key is required" }
  }

  // Check if this is the admin key
  if (isAdminKey(key)) {
    console.log("Admin key detected, setting admin_session cookie")

    // Set admin session cookie (15 minutes)
    const expires = new Date(Date.now() + ADMIN_SESSION_DURATION)

    // Set cookies with simpler options
    cookies().set("admin_session", "true", {
      expires,
      path: "/",
    })

    cookies().set("key_session", key, {
      expires,
      path: "/",
    })

    console.log("Admin login from IP:", ipAddress)

    // Log admin access to Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (webhookUrl) {
      await logAdminAccess(webhookUrl, ipAddress, headersList.get("user-agent") || "Unknown")
    }

    return {
      success: true,
      isAdmin: true,
      keyUsed: "admin-access", // Don't reveal the actual key
    }
  }

  // Validate the key
  const isValid = isValidKey(key)
  console.log("Key validation result:", isValid)

  if (!isValid) {
    return { success: false, error: "Invalid key" }
  }

  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
      return { success: false, error: "Webhook URL is not configured" }
    }

    console.log("User login from IP:", ipAddress)

    // Check if this key is allowed to be used from this IP
    if (!isKeyAllowedForIp(key, ipAddress)) {
      // Get the registered IP for this key
      const registeredIp = getRegisteredIpForKey(key)

      // Send security alert to Discord
      await sendSecurityAlert(webhookUrl, key, ipAddress, registeredIp)

      // Return error to the client
      return {
        success: false,
        error: "Security alert: This key is registered to a different IP address",
      }
    }

    // Register this key-IP pair if it's new
    registerKeyWithIp(key, ipAddress)

    // Get current timestamp
    const now = new Date()
    const timestamp = now.toISOString()

    // Format date and time for display
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })

    // Get remaining time for the key
    const remainingMs = getKeyRemainingTime(key)
    const remainingTime = formatRemainingTime(remainingMs)

    // Set embed color based on key type
    let embedColor = 3066993 // Default green for custom keys
    if (key === "admin") embedColor = 15548997
    if (key === "test") embedColor = 3447003

    // Create the embed
    const embed = {
      title: "Key Authentication Log",
      color: embedColor,
      fields: [
        {
          name: "Key Used",
          value: `\`${key}\``,
          inline: true,
        },
        {
          name: "IP Address",
          value: `\`${ipAddress}\``,
          inline: true,
        },
        {
          name: "Date",
          value: formattedDate,
          inline: true,
        },
        {
          name: "Time",
          value: formattedTime,
          inline: true,
        },
        {
          name: "Expires In",
          value: remainingTime,
          inline: true,
        },
      ],
      footer: {
        text: "Key Authentication System",
      },
      timestamp: timestamp,
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      return {
        success: false,
        error: `Failed to send message: ${response.status} ${errorData}`,
      }
    }

    console.log("Setting key_session cookie for:", key)

    // Set a session cookie for the dashboard with simpler options
    const keyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Set cookie with minimal options to ensure compatibility
    cookies().set("key_session", key, {
      expires: keyExpires,
      path: "/",
    })

    return {
      success: true,
      keyUsed: key,
      ipAddress,
      remainingTime,
      expiresIn: remainingMs,
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function addKey(formData: FormData) {
  if (!(await isAdminSession())) {
    return { success: false, error: "Unauthorized" }
  }

  const newKey = formData.get("newKey")
  const expirationHours = Number(formData.get("expirationHours") || "24")

  if (!newKey || typeof newKey !== "string" || newKey.trim() === "") {
    return { success: false, error: "Valid key is required" }
  }

  const added = addCustomKey(newKey.trim(), expirationHours)

  if (!added) {
    return { success: false, error: "Key already exists or is invalid" }
  }

  return {
    success: true,
    message: `Key "${newKey}" added successfully`,
    keys: getAllKeys(),
  }
}

export async function getKeys() {
  if (!(await isAdminSession())) {
    return { success: false, error: "Unauthorized", keys: [] }
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (webhookUrl) {
    // Get client IP for logging
    const headersList = headers()
    const ipAddress = getClientIp(headersList) || "Unknown IP"
    const userAgent = headersList.get("user-agent") || "Unknown"
    await logAdminPanelAccess(webhookUrl, ipAddress, userAgent)
  }

  return { success: true, keys: getAllKeys() }
}

export async function extendKey(formData: FormData) {
  if (!(await isAdminSession())) {
    return { success: false, error: "Unauthorized" }
  }

  const key = formData.get("key")
  const hours = Number(formData.get("hours") || "24")

  if (!key || typeof key !== "string") {
    return { success: false, error: "Key is required" }
  }

  const extended = extendKeyExpiration(key, hours)

  if (!extended) {
    return { success: false, error: "Failed to extend key" }
  }

  return {
    success: true,
    message: `Key "${key}" extended by ${hours} hours`,
    keys: getAllKeys(),
  }
}

export async function revokeKeyAction(formData: FormData) {
  if (!(await isAdminSession())) {
    return { success: false, error: "Unauthorized" }
  }

  const key = formData.get("key")

  if (!key || typeof key !== "string") {
    return { success: false, error: "Key is required" }
  }

  const revoked = revokeKey(key)

  if (!revoked) {
    return { success: false, error: "Failed to revoke key" }
  }

  return {
    success: true,
    message: `Key "${key}" revoked successfully`,
    keys: getAllKeys(),
  }
}

async function isAdminSession(): Promise<boolean> {
  const adminSession = cookies().get("admin_session")
  return adminSession?.value === "true"
}

export async function getCurrentKey(): Promise<string | undefined> {
  const keySession = cookies().get("key_session")
  return keySession?.value
}

async function logAdminAccess(webhookUrl: string, ipAddress: string, userAgent: string) {
  const now = new Date()

  const adminAccessEmbed = {
    title: "🔐 Admin Key Used",
    description: "Someone has successfully used the admin key",
    color: 16711680,
    fields: [
      {
        name: "IP Address",
        value: `\`${ipAddress}\``,
        inline: true,
      },
      {
        name: "Date & Time",
        value: now.toLocaleString(),
        inline: true,
      },
      {
        name: "User Agent",
        value: `\`${userAgent}\``,
        inline: false,
      },
    ],
    footer: {
      text: "Admin Access Log",
    },
    timestamp: now.toISOString(),
  }

  try {
    console.log("Sending admin access log with IP:", ipAddress)
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [adminAccessEmbed],
      }),
    })
  } catch (error) {
    console.error("Failed to log admin access:", error)
  }
}

async function logAdminPanelAccess(webhookUrl: string, ipAddress: string, userAgent: string) {
  const now = new Date()

  const adminPanelAccessEmbed = {
    title: "👁️ Admin Panel Accessed",
    description: "Someone has accessed the admin panel",
    color: 15105570,
    fields: [
      {
        name: "IP Address",
        value: `\`${ipAddress}\``,
        inline: true,
      },
      {
        name: "Date & Time",
        value: now.toLocaleString(),
        inline: true,
      },
      {
        name: "User Agent",
        value: `\`${userAgent}\``,
        inline: false,
      },
    ],
    footer: {
      text: "Admin Panel Access Log",
    },
    timestamp: now.toISOString(),
  }

  try {
    console.log("Sending admin panel access log with IP:", ipAddress)
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [adminPanelAccessEmbed],
      }),
    })
  } catch (error) {
    console.error("Failed to log admin panel access:", error)
  }
}

async function sendSecurityAlert(
  webhookUrl: string,
  key: string,
  attemptedIp: string,
  registeredIp: string | undefined,
) {
  const now = new Date()

  const securityEmbed = {
    title: "🚨 SECURITY ALERT: Unauthorized Key Usage",
    description: "Someone attempted to use a key from an unauthorized IP address",
    color: 16711680,
    fields: [
      {
        name: "Key",
        value: `\`${key}\``,
        inline: true,
      },
      {
        name: "Registered IP",
        value: `\`${registeredIp || "Unknown"}\``,
        inline: true,
      },
      {
        name: "Attempted IP",
        value: `\`${attemptedIp}\``,
        inline: true,
      },
      {
        name: "Date & Time",
        value: now.toLocaleString(),
        inline: false,
      },
    ],
    footer: {
      text: "Key Security System",
    },
    timestamp: now.toISOString(),
  }

  try {
    console.log("Sending security alert with attempted IP:", attemptedIp)
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [securityEmbed],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 4,
                label: "Block IP Permanently",
                custom_id: `block_ip:${attemptedIp}`,
              },
              {
                type: 2,
                style: 3,
                label: "Allow This IP",
                custom_id: `allow_ip:${attemptedIp}:${key}`,
              },
            ],
          },
        ],
      }),
    })
  } catch (error) {
    console.error("Failed to send security alert:", error)
  }
}

// Enhanced function to get client IP from headers
function getClientIp(headersList: Headers): string | null {
  // Log all headers for debugging
  console.log("All headers:", Array.from(headersList.entries()))

  // Priority order for IP headers (most reliable first)

  // 1. Cloudflare-specific header (very reliable when using Cloudflare)
  const cfConnectingIp = headersList.get("cf-connecting-ip")
  if (cfConnectingIp) {
    console.log("IP from cf-connecting-ip:", cfConnectingIp.trim())
    return cfConnectingIp.trim()
  }

  // 2. Vercel-specific header
  const vercelForwardedFor = headersList.get("x-vercel-forwarded-for")
  if (vercelForwardedFor) {
    const ip = vercelForwardedFor.split(",")[0].trim()
    console.log("IP from x-vercel-forwarded-for:", ip)
    return ip
  }

  // 3. Standard forwarded-for header (used by most proxies)
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    const ip = forwardedFor.split(",")[0].trim()
    console.log("IP from x-forwarded-for:", ip)
    return ip
  }

  // 4. Other common headers
  const realIp = headersList.get("x-real-ip")
  if (realIp) {
    console.log("IP from x-real-ip:", realIp.trim())
    return realIp.trim()
  }

  const clientIp = headersList.get("x-client-ip")
  if (clientIp) {
    console.log("IP from x-client-ip:", clientIp.trim())
    return clientIp.trim()
  }

  // 5. Forwarded header (less common but standard)
  const forwarded = headersList.get("forwarded")
  if (forwarded) {
    const matches = forwarded.match(/for="\[(.*?)\]/) || forwarded.match(/for=([^;]+)/)
    if (matches && matches[1]) {
      console.log("IP from forwarded:", matches[1])
      return matches[1].trim()
    }
  }

  // 6. True-Client-IP (Akamai and some CDNs)
  const trueClientIp = headersList.get("true-client-ip")
  if (trueClientIp) {
    console.log("IP from true-client-ip:", trueClientIp.trim())
    return trueClientIp.trim()
  }

  // 7. Fastly specific
  const fastlyClientIp = headersList.get("fastly-client-ip")
  if (fastlyClientIp) {
    console.log("IP from fastly-client-ip:", fastlyClientIp.trim())
    return fastlyClientIp.trim()
  }

  // 8. Remote address (least reliable, often internal)
  const remoteAddr = headersList.get("x-appengine-user-ip") || headersList.get("x-appengine-remote-addr")
  if (remoteAddr) {
    console.log("IP from appengine headers:", remoteAddr)
    return remoteAddr
  }

  console.log("No IP address found in headers")
  return null
}

function isLocalhost(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  )
}
