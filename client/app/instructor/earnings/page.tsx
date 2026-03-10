"use client"
 
import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Activity, 
  Sparkles,
  Search,
  Filter,
  Download,
  Calendar,
  MousePointer2,
  Clock,
  Briefcase,
  Users
} from "lucide-react"
import { cn } from "../../../lib/utils"
 
function EarningsContent() {
  const [activeTab, setActiveTab] = useState("overview")
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Fiscal Intelligence Hero ────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-[#020617] p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05]">
              <DollarSign className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                <CreditCard className="w-4 h-4" />
                Fiscal Intelligence Terminal
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  Revenue <br />
                  <span className="text-emerald-400">Architecture.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-400 leading-relaxed max-w-xl opacity-90">
                  Monitor the growth of your instructional enterprise. Real-time capital telemetry, extraction protocols, and peak performance analytics consolidated in a single executive surface.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button className="h-20 px-12 bg-white text-slate-900 rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl group">
                  <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                  EXPORT QUARTERLY AUDIT
                </button>
                <div className="flex items-center gap-4 h-20 px-8 rounded-[2.2rem] border border-white/10 bg-white/5 backdrop-blur-md">
                   <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Node Synchronized</span>
                </div>
              </div>
            </div>
 
            {/* Macro Balance Card */}
            <div className="flex flex-col gap-6 w-full max-w-md">
                <div className="relative p-10 rounded-[3.5rem] bg-white text-slate-900 shadow-2xl group/card overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover/card:opacity-[0.08] transition-opacity">
                      <TrendingUp className="w-32 h-32" />
                   </div>
                   <div className="relative z-10 space-y-6">
                      <div className="flex items-center justify-between">
                         <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">LIQUID CAPITAL</p>
                         <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[54px] font-black tracking-tighter tabular-nums leading-none">$42,980.00</p>
                         <div className="flex items-center gap-2 text-emerald-600">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-[13px] font-black uppercase tracking-widest">+12.4% THIS PHASE</span>
                         </div>
                      </div>
                      <div className="pt-6 border-t border-slate-50">
                         <button className="w-full h-16 rounded-2xl bg-[#020617] text-white text-[13px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-colors">
                            INITIATE EXTRACTION
                         </button>
                      </div>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Metric Infrastructure ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricBlock 
            label="Total Enterprise Volume" 
            value="$1.2M" 
            trend="+8%" 
            desc="Cumulative platform throughput." 
            icon={<Globe className="w-6 h-6" />}
         />
         <MetricBlock 
            label="Active Conversions" 
            value="2,482" 
            trend="+15%" 
            desc="Validated scholar transactions." 
            icon={<Users className="w-6 h-6" />}
         />
         <MetricBlock 
            label="Projected Yield" 
            value="$18,500" 
            trend="STEADY" 
            desc="Estimated end-of-quarter results." 
            icon={<Zap className="w-6 h-6" />}
         />
      </div>
 
      {/* ─── Data Surface ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         <div className="lg:col-span-8 bg-white rounded-[4rem] border border-slate-100 p-10 lg:p-14 shadow-sm relative overflow-hidden flex flex-col min-h-[600px]">
            <div className="absolute top-0 right-0 p-20 opacity-[0.01]">
               <Activity className="w-[30rem] h-[30rem]" />
            </div>
            
            <div className="flex items-center justify-between pb-12 border-b border-slate-50 relative z-10">
               <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">Transmission History</h3>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">// Fiscal event log synchronized with platform core</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all cursor-pointer shadow-sm">
                     <Filter className="w-5 h-5" />
                  </div>
               </div>
            </div>
 
            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-8 relative z-10">
               <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center mx-auto border border-emerald-100 shadow-xl shadow-emerald-500/5 animate-pulse">
                  <BarChart3 className="h-10 w-10 text-emerald-600" />
               </div>
               <div className="space-y-4 max-w-sm">
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Synchronizing Telemetry</h4>
                  <p className="text-[16px] font-medium text-slate-400 italic opacity-80 leading-relaxed">
                    The fiscal distribution matrix is currently populating. Detailed event logs will materialize shortly.
                  </p>
               </div>
            </div>
         </div>
 
         <div className="lg:col-span-4 space-y-8">
            <div className="p-10 lg:p-12 rounded-[3.5rem] bg-[#020617] border border-white/5 shadow-2xl relative overflow-hidden group/payout">
               <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
               <div className="relative z-10 space-y-10 text-white">
                  <div className="flex items-center justify-between">
                     <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 group-hover/payout:scale-110 group-hover/payout:rotate-6 transition-transform duration-700">
                        <Briefcase className="w-6 h-6 text-emerald-400" />
                     </div>
                     <Badge className="bg-emerald-500 text-white border-0 font-black px-4 py-1.5 rounded-full text-[9px] tracking-widest shadow-lg shadow-emerald-500/20">ELITE TIER</Badge>
                  </div>
                  <div className="space-y-3">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">PAYOUT ENDPOINT</h4>
                     <p className="text-2xl font-black tracking-tight leading-tight">Global Merchant <br /> Synchronization</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                     <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-emerald-400">
                        <span>Reliability Score</span>
                        <span>100%</span>
                     </div>
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-emerald-500" />
                     </div>
                  </div>
               </div>
            </div>
 
            <div className="p-10 lg:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-8">
               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">// Strategic Pointers</h4>
               <div className="space-y-6">
                  <PointerItem icon={<Zap className="w-4 h-4" />} title="Peak Utilization" desc="Course 'Neural Architecture' yields 40% more yield." />
                  <PointerItem icon={<Clock className="w-4 h-4" />} title="Retention Logic" desc="Renewal protocols active for 92% of scholars." />
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
 
function MetricBlock({ label, value, trend, desc, icon }: any) {
  return (
    <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group overflow-hidden relative">
       <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
          {icon}
       </div>
       <div className="relative z-10 space-y-8">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:rotate-6 transition-all duration-700 shadow-sm">
             {icon}
          </div>
          <div className="space-y-4">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline gap-3">
                   <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{value}</p>
                   <span className={cn("text-[10px] font-black px-2 py-1 rounded-full", trend.startsWith('+') ? "text-emerald-500 bg-emerald-50" : "text-slate-400 bg-slate-50")}>{trend}</span>
                </div>
             </div>
             <p className="text-[13px] font-bold text-slate-400 italic leading-relaxed opacity-80">{desc}</p>
          </div>
       </div>
    </div>
  )
}
 
function PointerItem({ icon, title, desc }: any) {
  return (
    <div className="flex gap-5 group/item">
       <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
          {icon}
       </div>
       <div className="space-y-1">
          <p className="text-[14px] font-black text-slate-900 leading-none">{title}</p>
          <p className="text-[12px] font-medium text-slate-400 italic leading-snug">{desc}</p>
       </div>
    </div>
  )
}
 
export default function InstructorEarningsPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-20 w-20 border-[8px] border-slate-100 border-t-emerald-600 rounded-full animate-spin shadow-2xl shadow-emerald-500/10" />
          <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse">Accessing Fiscal Terminal</p>
       </div>
    }>
       <EarningsContent />
    </Suspense>
  )
}
