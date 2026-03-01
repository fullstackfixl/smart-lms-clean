"use client"

import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"
import { EmptyState } from '../../../components/student/EmptyState'
import { Card } from '../../../components/ui/card'

export default function GradesPage() {
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
          Grades
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Track your academic performance
        </p>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <EmptyState
          icon={GraduationCap}
          title="No grades yet"
          description="Your grades will appear here once assignments are graded"
        />
      </Card>
    </div>
  )
}
