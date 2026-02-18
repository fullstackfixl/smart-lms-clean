"use client"

import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
        <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center border border-orange-200 dark:border-orange-800/30">
          <Icon className="h-12 w-12 text-orange-500 dark:text-orange-400" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-base text-slate-600 dark:text-slate-400 mb-6 max-w-md">
        {description}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}
