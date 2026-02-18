"use client"

import { motion } from "framer-motion"

export default function FeesPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
          Fees
        </h1>
        <p className="text-slate-400">Manage fees and payments</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-12 text-center"
      >
        <p className="text-slate-400">Fees page content coming soon...</p>
      </motion.div>
    </div>
  )
}
