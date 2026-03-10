"use client"
 
import React, { useState } from "react"
import { 
  BarChart3, 
  Download, 
  FileJson, 
  FileText, 
  Calendar, 
  Globe, 
  Database,
  TrendingUp,
  Activity,
  CheckCircle2
} from "lucide-react"
import { SimpleCard, MetricCard } from "../../../components/platform/core/SimpleCard"
import { SimpleLineChart, SimpleBarChart } from "../../../components/platform/core/BasicChart"
import { SimpleButton } from "../../../components/platform/core/SimpleButton"
import { cn } from "../../../lib/utils"
 
const comparisonData = [
  { name: 'Jan', value: 4000, completions: 2400 },
  { name: 'Feb', value: 5200, completions: 3100 },
  { name: 'Mar', value: 4800, completions: 2800 },
  { name: 'Apr', value: 6100, completions: 4200 },
  { name: 'May', value: 5800, completions: 3800 },
  { name: 'Jun', value: 7200, completions: 5100 },
  { name: 'Jul', value: 8500, completions: 6200 },
]
 
export default function ReportsPage() {
  const [exportLoading, setExportLoading] = useState(false)
 
  const triggerExport = () => {
    setExportLoading(true)
    setTimeout(() => setExportLoading(false), 2000)
  }
 
  return (
    <div className="space-y-12 pb-20">
      
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
               Analytics <span className="text-[#3B82F6]">Terminal.</span>
            </h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Comprehensive diagnostic suite for institutional ecosystem oversight.</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-1 rounded-md flex items-center">
               {["Last 30 Days", "Quarterly", "Yearly"].map((range, idx) => (
                  <button 
                    key={range}
                    className={cn(
                      "px-4 py-1.5 rounded-sm text-[11px] font-bold transition-all",
                      idx === 0 ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                     {range}
                  </button>
               ))}
            </div>
            <SimpleButton variant="secondary">
               <Calendar className="w-4 h-4 mr-2" /> Custom Range
            </SimpleButton>
         </div>
      </div>
 
      {/* ─── Metric Matrix ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="Global MAU" value="242.4k" trend="+12%" icon={<UsersIcon className="w-5 h-5" />} color="blue" />
         <MetricCard label="Avg Engagement" value="88.2%" trend="+4%" icon={<Activity className="w-5 h-5" />} color="green" />
         <MetricCard label="Content Volume" value="4.2k TB" trend="+82%" icon={<Database className="w-5 h-5" />} color="orange" />
         <MetricCard label="Peer Efficiency" value="94.1%" trend="Peak" icon={<CheckCircle2 className="w-5 h-5" />} color="rose" />
      </div>
 
      {/* ─── Analytical Layers ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <SimpleCard 
           title="Universal Consumption Matrix" 
           subtitle="Pedagogical engagement vs completion flux across global nodes" 
           className="lg:col-span-12"
           icon={<Globe className="w-5 h-5" />}
         >
            <SimpleLineChart data={comparisonData} xKey="name" yKey="value" color="#F97316" />
         </SimpleCard>
 
         <SimpleCard 
           title="Institutional Yield" 
           subtitle="Top performing organizational nodes by efficiency" 
           className="lg:col-span-8"
           icon={<Database className="w-5 h-5" />}
         >
            <SimpleBarChart data={comparisonData} xKey="name" yKey="value" color="#3B82F6" />
         </SimpleCard>
 
         <div className="lg:col-span-4 bg-[#F8FAFC] border border-gray-100 rounded-md p-10 flex flex-col justify-between">
            <div className="space-y-4">
               <h3 className="text-xl font-bold text-slate-900 uppercase italic tracking-tight">Export Protocols.</h3>
               <p className="text-[13px] text-slate-500 font-medium leading-relaxed italic">Synthesis of global telemetry into portable data matrices.</p>
            </div>
            
            <div className="space-y-3 mt-8">
               <ExportBtn icon={<FileText className="w-4 h-4" />} label="PDF Status Report" onClick={triggerExport} loading={exportLoading} />
               <ExportBtn icon={<FileJson className="w-4 h-4" />} label="JSON Data Payload" onClick={triggerExport} loading={exportLoading} />
               <ExportBtn icon={<Download className="w-4 h-4" />} label="CSV Direct Link" onClick={triggerExport} loading={exportLoading} />
            </div>
         </div>
      </div>
 
    </div>
  )
}
 
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
 
function ExportBtn({ icon, label, onClick, loading }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className="w-full h-12 bg-white border border-gray-200 rounded-sm flex items-center gap-3 px-4 hover:bg-gray-50 text-slate-700 font-bold text-[11px] uppercase tracking-widest transition-all group disabled:opacity-50"
    >
       {loading ? <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" /> : <div className="text-[#3B82F6]">{icon}</div>}
       {label}
    </button>
  )
}
