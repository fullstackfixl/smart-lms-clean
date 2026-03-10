"use client"
 
import { useState } from "react"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
 
export default function InvitesPage() {
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Invites</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Monitor and manage institutional outreach and faculty invitations.</p>
         </div>
         <MinimalButton variant="secondary" className="text-[15px]">
            Send Invite
         </MinimalButton>
      </div>
 
      {/* ─── Metrics Matrix ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <FlatCard className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">// Sent</span>
            <span className="text-2xl font-bold text-slate-900">0</span>
         </FlatCard>
         <FlatCard className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">// Pending</span>
            <span className="text-2xl font-bold text-slate-900">0</span>
         </FlatCard>
      </div>
 
      {/* ─── Outreach Registry ────────────────────────────────────── */}
      <FlatCard noPadding>
         <TextTable headers={["Email", "Status", "Sent Date", "Actions"]}>
            <TextRow>
               <TextCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                  No invitations identified in the registry. Start outreach to begin.
               </TextCell>
            </TextRow>
         </TextTable>
      </FlatCard>
 
    </div>
  )
}
