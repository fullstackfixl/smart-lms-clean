"use client"

import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'

export default function PlatformStaffSettingsPage() {
  return (
    <Card className="rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Access restricted</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Platform staff cannot modify system settings. Ask a platform admin if a configuration change is required.
      </p>
      <Button asChild className="mt-6 h-11 rounded-md bg-orange-500 font-bold text-white shadow-none hover:bg-orange-600">
        <Link href="/platform-staff/dashboard">Back to dashboard</Link>
      </Button>
    </Card>
  )
}
