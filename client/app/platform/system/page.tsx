"use client"
 
import React, { useState } from "react"
import { 
  ShieldCheck, 
  Terminal, 
  Database, 
  Settings2, 
  Zap, 
  Globe, 
  Lock, 
  RefreshCw, 
  HardDrive,
  Cpu,
  Server,
  Activity,
  ChevronRight,
  SearchCode
} from "lucide-react"
import { cn } from "../../../lib/utils"
 
export default function SystemSettingsPage() {
  const [synced, setSynced] = useState(true)
 
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">System</h1>
        <p className="mt-2 text-slate-500">Global platform configuration (coming soon).</p>
      </div>
      <div className="rounded-md border border-gray-200 bg-white p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Terminal className="mx-auto h-12 w-12 text-slate-200 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-bold text-slate-900 mb-2">System console coming soon</h3>
            <p className="text-sm text-slate-500">Feature flags, infrastructure checks and global parameters will live here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
