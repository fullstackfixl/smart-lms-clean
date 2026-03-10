"use client"
 
import { useState } from "react"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { MinimalButton, MinimalInput } from "../../../components/org-admin/core/MinimalForm"
import { useAuth } from "../../../lib/auth-context"
 
export default function SettingsPage() {
  const { organization } = useAuth()
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-8">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Settings</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Configure institutional protocols and platform preferences.</p>
         </div>
         <MinimalButton variant="secondary" className="text-[15px]">
            Save Changes
         </MinimalButton>
      </div>
 
      {/* ─── Configuration Stack ────────────────────────────────────── */}
      <div className="max-w-2xl space-y-10">
         
         <div className="space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest italic">// General Protocols</h3>
            <div className="space-y-4">
               <MinimalInput label="Organization Name" defaultValue={organization?.name} />
               <MinimalInput label="Contact Email" placeholder="admin@org.com" />
               <MinimalInput label="Timezone" defaultValue="UTC (Coordinated Universal Time)" />
            </div>
         </div>
 
         <div className="space-y-6 pt-4">
            <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest italic">// Security & Privacy</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-md">
                  <div className="space-y-0.5">
                     <p className="text-[13px] font-bold text-slate-900 uppercase">Two-Factor Authentication</p>
                     <p className="text-[11px] text-slate-500">Enforce secondary verification for all administrators.</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#F97316] uppercase italic">Disabled</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-md">
                  <div className="space-y-0.5">
                     <p className="text-[13px] font-bold text-slate-900 uppercase">Public Directory</p>
                     <p className="text-[11px] text-slate-500">List this organization in the marketplace discovery hub.</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#10B981] uppercase italic">Active</span>
               </div>
            </div>
         </div>
 
      </div>
 
    </div>
  )
}
