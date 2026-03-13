"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PlatformStaffPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/platform-staff/dashboard')
  }, [router])

  return null
}
