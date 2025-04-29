// Enhanced key store with support for custom codes, obfuscation, and expiration

// Interface for key data
interface KeyData {
  ip?: string
  expiresAt?: number // Timestamp in milliseconds
  usageCount: number
}

// Map to store key -> KeyData associations
const keyDataMap = new Map<string, KeyData>()

// Set of valid keys (starts with default keys)
const validKeys = new Set<string>([atob("QURNSU4tdGVzdA==")])

// Default expiration time (24 hours)
const DEFAULT_EXPIRATION_MS = 24 * 60 * 60 * 1000

// Simple obfuscation function (not truly secure, but adds a layer of obscurity)
export function obfuscateKey(key: string): string {
  return btoa(key.split("").reverse().join(""))
}

// Deobfuscation function
export function deobfuscateKey(obfuscated: string): string {
  try {
    return atob(obfuscated).split("").reverse().join("")
  } catch (e) {
    return ""
  }
}

// The admin key is obfuscated
const adminKeyObfuscated = "OTY5NnlkZGlk"

export function isAdminKey(key: string): boolean {
  return key === deobfuscateKey(adminKeyObfuscated)
}

export function registerKeyWithIp(key: string, ip: string): void {
  // If this is the first time this key is used, register the IP
  if (!keyDataMap.has(key)) {
    keyDataMap.set(key, {
      ip,
      expiresAt: Date.now() + DEFAULT_EXPIRATION_MS,
      usageCount: 1,
    })
  } else {
    // Update usage count and ensure IP is set
    const keyData = keyDataMap.get(key)!
    keyData.usageCount += 1
    // Make sure IP is set (fixes issue with newly created keys)
    if (!keyData.ip) {
      keyData.ip = ip
    }
    keyDataMap.set(key, keyData)
  }
}

export function isKeyAllowedForIp(key: string, ip: string): boolean {
  // Admin key is always allowed from any IP
  if (isAdminKey(key)) {
    return true
  }

  // If key isn't registered yet, it's allowed
  if (!keyDataMap.has(key)) {
    return true
  }

  // Check if the IP matches the registered IP for this key
  const keyData = keyDataMap.get(key)!

  // If IP isn't set yet for this key, allow it
  if (!keyData.ip) {
    return true
  }

  return keyData.ip === ip
}

export function getRegisteredIpForKey(key: string): string | undefined {
  return keyDataMap.get(key)?.ip
}

export function isValidKey(key: string): boolean {
  // Admin key is always valid
  if (isAdminKey(key)) {
    return true
  }

  // Check if key exists and hasn't expired
  if (keyDataMap.has(key)) {
    const keyData = keyDataMap.get(key)!
    if (keyData.expiresAt && keyData.expiresAt < Date.now()) {
      // Key has expired, remove it
      keyDataMap.delete(key)
      return false
    }
  }

  return validKeys.has(key)
}

export function addCustomKey(key: string, expirationHours = 24): boolean {
  // Don't allow adding empty keys or duplicates
  if (!key || validKeys.has(key)) {
    return false
  }

  validKeys.add(key)

  // Set expiration time if not already set
  if (!keyDataMap.has(key)) {
    keyDataMap.set(key, {
      expiresAt: Date.now() + expirationHours * 60 * 60 * 1000,
      usageCount: 0,
    })
  }

  return true
}

export function getAllKeys(): Array<{ key: string; data: KeyData }> {
  return Array.from(validKeys).map((key) => ({
    key,
    data: keyDataMap.get(key) || { usageCount: 0 },
  }))
}

export function getKeyExpirationTime(key: string): number | undefined {
  return keyDataMap.get(key)?.expiresAt
}

export function extendKeyExpiration(key: string, additionalHours: number): boolean {
  if (!keyDataMap.has(key)) {
    return false
  }

  const keyData = keyDataMap.get(key)!
  const currentExpiration = keyData.expiresAt || Date.now()
  keyData.expiresAt = currentExpiration + additionalHours * 60 * 60 * 1000
  keyDataMap.set(key, keyData)

  return true
}

export function revokeKey(key: string): boolean {
  if (!validKeys.has(key)) {
    return false
  }

  validKeys.delete(key)
  keyDataMap.delete(key)
  return true
}

export function getKeyRemainingTime(key: string): number {
  const expiresAt = keyDataMap.get(key)?.expiresAt
  if (!expiresAt) return 0

  const remaining = expiresAt - Date.now()
  return remaining > 0 ? remaining : 0
}

export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return "Expired"

  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}
