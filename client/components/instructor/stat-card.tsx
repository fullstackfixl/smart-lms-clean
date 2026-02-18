"use client"

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange'
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

const colorClasses = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    iconBg: 'bg-green-100 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  purple: {
    iconBg: 'bg-purple-100 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    iconBg: 'bg-orange-100 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
}

/**
 * StatCard component for displaying key metrics on dashboard
 * Features:
 * - Colored icon circle with proper theming
 * - Large bold value display
 * - Optional trend indicator
 * - Hover lift animation (scale 1.02)
 * - Full light/dark theme support
 */
export function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  const colors = colorClasses[color]

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {value}
            </p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={cn(
            "flex items-center justify-center h-12 w-12 rounded-lg",
            colors.iconBg
          )}>
            <Icon className={cn("h-6 w-6", colors.iconColor)} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
