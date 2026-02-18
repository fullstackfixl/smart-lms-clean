"use client"

import { MessageSquare } from "lucide-react"

export default function InstructorMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Communicate with students</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
        <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No messages</p>
        <p className="text-sm text-muted-foreground">Your conversations will appear here</p>
      </div>
    </div>
  )
}
