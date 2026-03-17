"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import RoleLoginForm from "../../../components/auth/RoleLoginForm"

export default function OrgAdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <RoleLoginForm
        expectedRole="organization_admin"
        title="Log in as Organization Admin"
        subtitle="New to Instatute?"
      />
    </Suspense>
  )
}
