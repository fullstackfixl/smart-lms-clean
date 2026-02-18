"use client"

import { UserCheck } from "lucide-react"

export default function InstructorAttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">Track student attendance</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
        <UserCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No attendance records</p>
        <p className="text-sm text-muted-foreground">Mark attendance for your classes</p>
      </div>
    </div>
  )
}
