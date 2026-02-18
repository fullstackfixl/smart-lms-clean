"use client"

import { motion } from "framer-motion"
import { Award } from "lucide-react"
import { EmptyState } from "@/components/student/EmptyState"
import { Card } from "@/components/ui/card"

export default function CertificatesPage() {
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
          Certificates
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Your achievements and completed courses
        </p>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete courses to earn certificates and showcase your skills"
        />
      </Card>
    </div>
  )
}
