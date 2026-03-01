"use client"

import { motion } from "framer-motion"
import { BarChart3 } from "lucide-react"
import { Card } from '../../../components/ui/card'
import { EmptyState } from '../../../components/instructor/empty-state'

export default function InstructorAnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Track your course performance and student engagement</p>
      </motion.div>

      {/* Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            icon={BarChart3}
            title="Analytics Coming Soon"
            subtitle="We're working on bringing you detailed insights about your courses and students."
          />
        </Card>
      </motion.div>
    </div>
  )
}
