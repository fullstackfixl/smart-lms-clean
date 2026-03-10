"use client"
 
import React from "react"
import { 
  SearchCode, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  Zap, 
  Globe, 
  CheckCircle2, 
  Database,
  Search,
  ArrowUpRight,
  BrainCircuit,
  PieChart as PieIcon,
  Sparkles,
  SearchCheck
} from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "../../../lib/utils"
 
export default function InsightsPage() {
  return (
    <div className="space-y-16 pb-20">
      
      {/* ─── Strategic Insights Hero ──────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[4rem] bg-black/40 backdrop-blur-xl border border-white/10 p-12 lg:p-20 shadow-2xl">
         <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[40rem] h-[40rem] bg-orange-600/10 rounded-full blur-[140px]" />
         
         <div className="relative z-10 space-y-8 max-w-3xl">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-black uppercase tracking-[0.2em] border border-orange-500/20">
               <BrainCircuit className="w-4 h-4" />
               Neural Insights Terminal
            </div>
            <div className="space-y-4">
               <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-none uppercase">
                  Strategic <br />
                  <span className="text-gradient-orange italic">Intelligence.</span>
               </h1>
               <p className="text-[20px] font-medium text-slate-400 italic leading-relaxed opacity-80 max-w-2xl">
                  Advanced pattern recognition. Identify high-yield academic corridors, consumption anomalies, and predictive growth vectors across the global cluster.
               </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
               <div className="px-8 py-5 rounded-[2rem] bg-orange-500 text-white orange-glow-lg flex items-center gap-6 group cursor-pointer hover:scale-105 transition-all">
                  <Sparkles className="w-8 h-8 opacity-40 group-hover:rotate-12 transition-transform" />
                  <div className="text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-80">AI Suggestion</p>
                     <p className="text-[17px] font-black tracking-tight leading-none uppercase italic">Scale APAC Infrastructure now</p>
                  </div>
               </div>
            </div>
         </div>
      </section>
 
      {/* ─── Neural Insights Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
         <InsightCard 
           icon={<Target className="w-8 h-8" />} 
           label="Institutional Focus" 
           title="STEM Sector Dominance" 
           description="Predictive models indicate a 24% surge in STEM consumption within the next 3 fiscal cycles."
           trend="+24% Forecast"
           color="orange"
         />
         <InsightCard 
           icon={<Globe className="w-8 h-8" />} 
           label="Geographic Vector" 
           title="South American Corridor" 
           description="Anomalous organic expansion detected in the Brazilian academic cluster. Prime for Enterprise deployment."
           trend="High Signal"
           color="blue"
         />
         <InsightCard 
           icon={<TrendingUp className="w-8 h-8" />} 
           label="Growth Anomaly" 
           title="Micro-Credential Flux" 
           description="Significant reduction in long-form curriculum engagement with inverse surge in modular pathways."
           trend="-12% / +48%"
           color="emerald"
         />
      </div>
 
      {/* ─── Intelligence Matrix ─────────────────────────────────────── */}
      <section className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-16">
         <div className="flex-1 space-y-8">
            <div className="space-y-3">
               <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight italic">Pattern Recognition Engine</h3>
               <p className="text-[18px] font-medium text-slate-400 italic leading-relaxed opacity-80">
                  Our neural engine audits over 12 million daily interactions to synthesize actionable strategic protocols for the global administration.
               </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="p-6 h-32 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-center gap-2">
                  <p className="text-[32px] font-black text-white leading-none tabular-nums">1.2M+</p>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none italic opacity-80">Daily Signals</p>
               </div>
               <div className="p-6 h-32 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-center gap-2">
                  <p className="text-[32px] font-black text-orange-500 leading-none tabular-nums">98.2%</p>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none italic opacity-80">Accuracy Index</p>
               </div>
            </div>
         </div>
         <div className="w-full lg:w-[500px] h-[400px] rounded-[3rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl p-10 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <SearchCheck className="w-40 h-40 text-orange-500/20 group-hover:scale-125 transition-transform duration-1000" />
            <p className="absolute bottom-10 text-[10px] font-black text-orange-500 uppercase tracking-[0.5em] animate-pulse">Scanning Cloud Cluster...</p>
         </div>
      </section>
 
    </div>
  )
}
 
function InsightCard({ icon, label, title, description, trend, color }: any) {
  const colors: any = {
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
  }
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="p-12 rounded-[4rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 group hover:border-orange-500/30 transition-all space-y-10 shadow-xl"
    >
       <div className={cn("w-20 h-20 rounded-[2.5rem] flex items-center justify-center border group-hover:rotate-12 transition-all duration-500", colors[color])}>
          {icon}
       </div>
       <div className="space-y-6">
          <div className="space-y-3">
             <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none italic opacity-60">// {label}</p>
             <h4 className="text-3xl font-black text-white tracking-tighter leading-none group-hover:text-orange-500 transition-colors uppercase italic">{title}</h4>
          </div>
          <p className="text-[15px] font-medium text-slate-400 leading-relaxed italic opacity-80">{description}</p>
          <div className="pt-4 flex items-center justify-between border-t border-white/5">
             <p className="text-[13px] font-black text-orange-500 tracking-widest uppercase">{trend}</p>
             <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                <ArrowUpRight className="w-5 h-5" />
             </button>
          </div>
       </div>
    </motion.div>
  )
}
