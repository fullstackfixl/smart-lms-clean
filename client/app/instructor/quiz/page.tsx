"use client"

import { FileQuestion } from "lucide-react"

export default function InstructorQuizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Quiz</h1>
        <p className="text-muted-foreground">Build assessments for your students</p>
      </div>
      
      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
        <FileQuestion className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">Quiz builder coming soon</p>
        <p className="text-sm text-muted-foreground">Create engaging quizzes for your students</p>
      </div>
    </div>
  )
}
