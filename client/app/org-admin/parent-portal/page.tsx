"use client"
 
import { useState } from "react"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton } from "../../../components/org-admin/core/MinimalForm"
 
export default function ParentPortalPage() {
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Parent Portal</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Manage family communication and parental oversight interfaces.</p>
         </div>
      </div>
 
      {/* ─── Family Hub ─────────────────────────────────────────── */}
      <FlatCard noPadding>
         <TextTable headers={["Guardian Name", "Linked Learner", "Portal Status", "Actions"]}>
            <TextRow>
               <TextCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                  No parental nodes identified. Start inviting guardians to enable oversight.
               </TextCell>
            </TextRow>
         </TextTable>
      </FlatCard>
 
    </div>
  )
}
