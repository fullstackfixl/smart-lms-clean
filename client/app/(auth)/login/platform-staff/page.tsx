"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import RoleLoginForm from "../../../../components/auth/RoleLoginForm"

export default function PlatformStaffLoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <RoleLoginForm
        expectedRole="platform_staff"
        title="Log in as Platform Staff"
        subtitle="New to Instatute?"
      />
    </Suspense>
  )
}
