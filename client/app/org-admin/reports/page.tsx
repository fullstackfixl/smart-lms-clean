"use client"
 
import { useState } from "react"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton } from "../../../components/org-admin/core/MinimalForm"
import { PlainChart } from "../../../components/org-admin/core/PlainChart"
import { cn } from "../../../lib/utils"
 
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overall')
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Reports</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">High-fidelity institutional analytics and performance telemetry.</p>
         </div>
         <MinimalButton variant="secondary" className="text-[15px]">
            Generate Report
         </MinimalButton>
      </div>
 
      {/* ─── Analytic Tabs ───────────────────────────────────────── */}
      <div className="flex items-center gap-8 border-b border-gray-100 pb-px">
         {['Overall', 'Academic Year', 'Live Sessions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              className={cn(
                "pb-3 text-[13px] font-bold uppercase tracking-tight relative",
                activeTab === tab.toLowerCase().replace(' ', '-') ? "text-[#3B82F6]" : "text-slate-400 hover:text-slate-600"
              )}
            >
               {tab}
               {activeTab === tab.toLowerCase().replace(' ', '-') && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B82F6]" />
               )}
            </button>
         ))}
      </div>
 
      {/* ─── Performance Matrix ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <FlatCard className="space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900 italic">// ENROLLMENT VELOCITY</h3>
            <PlainChart 
               type="bar" 
               dataKey="count" 
               data={[{name: 'W1', count: 10}, {name: 'W2', count: 25}, {name: 'W3', count: 15}, {name: 'W4', count: 40}]} 
            />
         </FlatCard>
 
         <FlatCard className="space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900 italic">// ACADEMIC ENGAGEMENT</h3>
            <TextTable headers={["Metric", "Value", "Status"]}>
               <TextRow>
                  <TextCell bold>Retention Rate</TextCell>
                  <TextCell>94%</TextCell>
                  <TextCell className="text-[#10B981] font-bold">OPTIMAL</TextCell>
               </TextRow>
               <TextRow>
                  <TextCell bold>Completion Ratio</TextCell>
                  <TextCell>78%</TextCell>
                  <TextCell className="text-[#F97316] font-bold">MONITOR</TextCell>
               </TextRow>
            </TextTable>
         </FlatCard>
      </div>
 
    </div>
  )
}
