"use client"

import { Calendar } from "lucide-react"

export default function AdminEventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-muted-foreground">Manage organization events</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
        <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No events scheduled</p>
        <p className="text-sm text-muted-foreground">Create events for your organization</p>
      </div>
    </div>
  )
}
