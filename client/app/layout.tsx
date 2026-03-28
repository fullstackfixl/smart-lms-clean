import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Sora } from "next/font/google"
import { Toaster } from "sonner"
import { Providers } from '../components/providers'

import "./globals.css"

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

export const metadata: Metadata = {
  title: "Instatute - The Future of Institutional Learning",
  description:
    "A scalable, multi-tenant learning management platform built for institutes, colleges, and schools. AI-powered courses, gamification, live classes, and more.",
  keywords: ["LMS", "Instatute", "Institute", "College", "School", "Online Learning", "AI Education", "Course Platform"],
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${sora.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid rgba(226,232,240,0.95)",
              color: "#0f172a",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
            },
          }}
        />
      </body>
    </html>
  )
}
