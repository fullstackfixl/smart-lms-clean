"use client"

import React from "react"
import { ThemeProvider } from '../components/theme-provider'
import { AuthProvider } from '../lib/auth-context'
import { SWRConfig } from 'swr'
import { toast } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          shouldRetryOnError: false,
          onError: (error) => {
            const message = (error && (error.message || error.toString())) || 'Request failed'
            toast.error(message)
          },
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </SWRConfig>
    </ThemeProvider>
  )
}
