"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface StatCardProps {
  title: string
  value: number | string
  change?: number
  icon: LucideIcon
  gradient: string
  delay?: number
}

export function StatCard({ title, value, change, icon: Icon, gradient, delay = 0 }: StatCardProps) {
  // Convert string value to number for animation, or use as-is if already a number
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0 : value;
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = numericValue / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setCount(numericValue)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [numericValue])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-2xl" style={{ background: gradient }} />
      <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              change >= 0 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "bg-red-500/10 text-red-400"
            }`}>
              <span>{change >= 0 ? "+" : ""}{change}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-100">
            {typeof value === 'string' ? value : count.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
