import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { Providers } from "@/components/providers"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Instatute - The Future of Institutional Learning",
  description:
    "A scalable, multi-tenant learning management platform built for institutes, colleges, and schools. AI-powered courses, gamification, live classes, and more.",
  keywords: ["LMS", "Instatute", "Institute", "College", "School", "Online Learning", "AI Education", "Course Platform"],
}

export const viewport: Viewport = {
  themeColor: "#0c0a09",
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(30 6% 7%)",
              border: "1px solid hsl(30 5% 15%)",
              color: "hsl(40 10% 94%)",
            },
          }}
        />
      </body>
    </html>
  )
}
