"use client"

import { motion } from "framer-motion"
import { FileQuestion } from "lucide-react"
import { EmptyState } from "@/components/student/EmptyState"
import { Card } from "@/components/ui/card"

export default function QuizzesPage() {
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
          Quizzes
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Test your knowledge and track your progress
        </p>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <EmptyState
          icon={FileQuestion}
          title="No quizzes available"
          description="Quizzes will appear here once you enroll in courses"
        />
      </Card>
    </div>
  )
}
