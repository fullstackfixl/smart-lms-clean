"use client"
 
import { useState } from "react"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
 
export default function ContentPage() {
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Content</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Manage your courses, lessons, and digital assets.</p>
         </div>
         <MinimalButton variant="secondary" className="text-[15px]">
            Add Content
         </MinimalButton>
      </div>
 
      {/* ─── Metrics Matrix ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <FlatCard className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">{'// Total Lessons'}</span>
            <span className="text-2xl font-bold text-slate-900">0</span>
         </FlatCard>
         <FlatCard className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">{'// Total Assignments'}</span>
            <span className="text-2xl font-bold text-slate-900">0</span>
         </FlatCard>
      </div>
 
      {/* ─── Content Table ───────────────────────────────────────── */}
      <FlatCard noPadding>
         <TextTable headers={["Item Name", "Type", "Status", "Actions"]}>
            <TextRow>
               <TextCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                  No content yet. Add lessons or assignments to begin.
               </TextCell>
            </TextRow>
         </TextTable>
      </FlatCard>
 
    </div>
  )
}
