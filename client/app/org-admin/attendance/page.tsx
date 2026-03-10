"use client"
 
import { useState } from "react"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton, MinimalSelect } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
 
export default function AttendancePage() {
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Attendance</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Track student presence and institutional engagement logs.</p>
         </div>
         <div className="flex items-center gap-4">
            <MinimalSelect 
              label="" 
              options={[{label: 'Select Date', value: ''}]} 
              className="w-40 bg-[#F8FAFC]"
            />
         </div>
      </div>
 
      {/* ─── Tracking Log ────────────────────────────────────────── */}
      <FlatCard noPadding>
         <TextTable headers={["Student Profile", "Session", "Status", "Actions"]}>
            <TextRow>
               <TextCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                  No attendance telemetry recorded for this period.
               </TextCell>
            </TextRow>
         </TextTable>
      </FlatCard>
 
    </div>
  )
}