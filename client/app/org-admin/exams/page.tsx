"use client"
 
import { useState } from "react"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
 
export default function ExamsPage() {
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Exams</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Manage institutional assessments, evaluations, and grading protocols.</p>
         </div>
         <MinimalButton variant="secondary" className="text-[15px]">
            Create Exam
         </MinimalButton>
      </div>
 
      {/* ─── Assessment Stack ─────────────────────────────────────── */}
      <FlatCard noPadding>
         <TextTable headers={["Exam Protocol", "Schedule", "Avg Score", "Actions"]}>
            <TextRow>
               <TextCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                  No assessments identified in the registry. Standby for protocol creation.
               </TextCell>
            </TextRow>
         </TextTable>
      </FlatCard>
 
    </div>
  )
}
