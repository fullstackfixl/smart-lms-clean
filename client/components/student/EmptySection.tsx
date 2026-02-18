"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptySectionProps {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
}

export function EmptySection({ icon: Icon, title, description, delay = 0 }: EmptySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800",
        "bg-black/50 backdrop-blur-md p-12",
        "text-center"
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      
      {/* Content */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.2, type: "spring", bounce: 0.4 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 mb-6"
        >
          <Icon className="w-10 h-10 text-orange-500" strokeWidth={1.5} />
        </motion.div>
        
        <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">{description}</p>
      </div>
    </motion.div>
  )
}
