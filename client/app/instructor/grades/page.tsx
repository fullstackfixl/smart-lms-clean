"use client"

import { BarChart3 } from "lucide-react"

export default function InstructorGradesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Grade Entry</h1>
        <p className="text-muted-foreground">Enter and manage student grades</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
        <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No grades to enter</p>
        <p className="text-sm text-muted-foreground">Grade your students' work</p>
      </div>
    </div>
  )
}
