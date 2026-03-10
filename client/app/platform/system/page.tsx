"use client"
 
import React, { useState } from "react"
import { 
  ShieldCheck, 
  Terminal, 
  Database, 
  Settings2, 
  Zap, 
  Globe, 
  Lock, 
  RefreshCw, 
  HardDrive,
  Cpu,
  Server,
  Activity,
  ChevronRight,
  SearchCode
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "../../../lib/utils"
 
export default function SystemSettingsPage() {
  const [synced, setSynced] = useState(true)
 
  return (
    <div className="space-y-16 pb-20">
      
      {/* ─── System Control Hero ─────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[4rem] bg-black/40 backdrop-blur-xl border border-white/10 p-12 lg:p-20 shadow-2xl">
         <div className="absolute top-0 left-0 -ml-16 -mt-16 w-[35rem] h-[35rem] bg-orange-600/10 rounded-full blur-[140px]" />
         
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-8 max-w-xl">
               <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-black uppercase tracking-[0.2em] border border-orange-500/20">
                  <Terminal className="w-4 h-4" />
                  System Control Terminal
               </div>
               <div className="space-y-4">
                  <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-none uppercase">
                     System <br />
                     <span className="text-gradient-orange italic">Architect.</span>
                  </h1>
                  <p className="text-[18px] font-medium text-slate-400 italic leading-relaxed opacity-80">
                     Global configuration console. Orchestrate feature flags, audit cluster heuristics, and manage high-level infrastructure parameters.
                  </p>
               </div>
            </div>
 
            <div className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl w-full lg:w-[400px] space-y-8">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cluster Health</p>
                     <p className="text-3xl font-black text-emerald-500">OPTIMAL</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                     <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
                  </div>
               </div>
               <div className="pt-6 border-t border-white/5 space-y-4">
                  <HealthBar label="Database Latency" value="12ms" percent={15} />
                  <HealthBar label="Compute Threshold" value="42%" percent={42} />
               </div>
            </div>
         </div>
      </section>
 
      {/* ─── Control Matrix ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         
         <section className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[3.5rem] p-12 lg:p-14 space-y-10 shadow-2xl">
            <div className="space-y-2">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic font-serif opacity-60 px-1">// Feature Flagging</h3>
               <p className="text-3xl font-black text-white tracking-tight leading-none uppercase">Protocol Switches</p>
            </div>
            
            <div className="space-y-6">
               <ToggleSwitch label="Global Course Marketplace" description="Enable access to the public course ecosystem." active />
               <ToggleSwitch label="AI Neural Assessments" description="Allow organizations to deploy AI-powered quizes." active />
               <ToggleSwitch label="Real-Time Peer Mentoring" description="Activate peer-to-peer strategic uplink." />
               <ToggleSwitch label="Institutional Analytics V2" description="Beta deployment of the new telemetry engine." active />
            </div>
         </section>
 
         <section className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[3.5rem] p-12 lg:p-14 space-y-10 shadow-2xl">
            <div className="space-y-2">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic font-serif opacity-60 px-1">// Infrastructure Audit</h3>
               <p className="text-3xl font-black text-white tracking-tight leading-none uppercase">Global Logistics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <SystemBox icon={<Globe className="w-5 h-5" />} label="CDN Regions" value="12 Active" />
               <SystemBox icon={<Database className="w-5 h-5" />} label="Data Clusters" value="P-1/P-2" />
               <SystemBox icon={<ShieldCheck className="w-5 h-5" />} label="Security Grade" value="AAA+" />
               <SystemBox icon={<Zap className="w-5 h-5" />} label="Power Flux" value="Optimal" />
            </div>
 
            <div className="pt-4 space-y-4">
               <button className="h-20 w-full bg-orange-500 text-white rounded-[2rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-xl orange-glow flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all">
                  <RefreshCw className="w-5 h-5 fill-white animate-spin-slow" /> Re-sync Global State
               </button>
            </div>
         </section>
      </div>
 
    </div>
  )
}
 
function HealthBar({ label, value, percent }: any) {
  return (
    <div className="space-y-2">
       <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-[11px] font-black text-white">{value}</p>
       </div>
       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div initial={{ width: 0 }} whileInView={{ width: `${percent}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500 rounded-full" />
       </div>
    </div>
  )
}
 
function ToggleSwitch({ label, description, active }: any) {
  return (
    <div className="flex items-center justify-between gap-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-orange-500/20 transition-all group cursor-pointer">
       <div className="space-y-1">
          <p className="text-[15px] font-black text-white group-hover:text-orange-500 transition-colors uppercase italic tracking-tight">{label}</p>
          <p className="text-[12px] font-medium text-slate-500 leading-tight italic opacity-80">{description}</p>
       </div>
       <div className={cn(
         "w-16 h-8 rounded-full border p-1 transition-all duration-500",
         active ? "bg-orange-500 border-orange-400" : "bg-white/5 border-white/10"
       )}>
          <div className={cn(
            "h-full aspect-square bg-white rounded-full shadow-lg transition-transform duration-500 transform",
            active ? "translate-x-8" : "translate-x-0 bg-slate-700"
          )} />
       </div>
    </div>
  )
}
 
function SystemBox({ icon, label, value }: any) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 group hover:border-orange-500/30 transition-all text-center space-y-4">
       <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-2 border border-orange-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all">
          {icon}
       </div>
       <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-[18px] font-black text-white italic">{value}</p>
       </div>
    </div>
  )
}
