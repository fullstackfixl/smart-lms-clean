"use client"

import { motion } from "framer-motion"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  color: "blue" | "green" | "orange" | "purple"
  index: number
}

const colorClasses = {
  blue: "from-blue-600/20 to-blue-600/5 border-blue-500/30",
  green: "from-green-600/20 to-green-600/5 border-green-500/30",
  orange: "from-orange-600/20 to-orange-600/5 border-orange-500/30",
  purple: "from-purple-600/20 to-purple-600/5 border-purple-500/30",
}

const iconColorClasses = {
  blue: "text-blue-400",
  green: "text-green-400",
  orange: "text-orange-400",
  purple: "text-purple-400",
}

export function MetricCard({ title, value, change, icon: Icon, color, index }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-md",
        "bg-gradient-to-br",
        colorClasses[color],
        "p-6 transition-all duration-300",
        "hover:shadow-lg hover:shadow-orange-500/10"
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl bg-black/30", iconColorClasses[color])}>
            <Icon className="w-6 h-6" strokeWidth={1.5} />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
              change >= 0 ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
            )}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-4xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}
