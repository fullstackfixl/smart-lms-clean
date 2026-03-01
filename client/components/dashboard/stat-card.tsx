"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  icon: LucideIcon
  color?: string
  delay?: number
  trend?: string
}

export function StatCard({ label, value, change, icon: Icon, color = "text-primary", delay = 0, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Background Gradient */}
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            {(trend || change) && (
              <p className="mt-2 text-xs font-medium text-primary">
                {trend || change}
              </p>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-transform group-hover:scale-110",
            color
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}