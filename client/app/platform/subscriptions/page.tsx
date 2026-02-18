"use client"

import { CreditCard } from "lucide-react"

export default function PlatformSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">Manage organization subscriptions</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
        <CreditCard className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No subscriptions</p>
        <p className="text-sm text-muted-foreground">Subscription data will appear here</p>
      </div>
    </div>
  )
}
