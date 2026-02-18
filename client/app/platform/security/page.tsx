"use client"

import { motion } from "framer-motion"
import { Shield } from "lucide-react"

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-gray-50 mb-2">Security</h1>
        <p className="text-lg text-gray-400">Platform security settings and monitoring</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-gray-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Security dashboard coming soon</h3>
            <p className="text-gray-500">Security monitoring and configuration</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
