"use client"

import { Shield } from "lucide-react"

export default function SecurityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">Security</h1>
        <p className="mt-2 text-slate-500">Platform security settings and monitoring</p>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-slate-200 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Security dashboard coming soon</h3>
            <p className="text-sm text-slate-500">Security monitoring and configuration</p>
          </div>
        </div>
      </div>
    </div>
  )
}
