import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "./components/notification-container"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Key Validation System",
  description: "Secure access with IP tracking",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
