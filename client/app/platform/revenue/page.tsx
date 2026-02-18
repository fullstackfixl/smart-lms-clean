"use client"

import { motion } from "framer-motion"
import { DollarSign } from "lucide-react"

export default function RevenuePage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-gray-50 mb-2">Revenue</h1>
        <p className="text-lg text-gray-400">Track platform revenue and financial metrics</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <DollarSign className="mx-auto h-16 w-16 text-gray-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Revenue analytics coming soon</h3>
            <p className="text-gray-500">Financial reports and revenue tracking</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
