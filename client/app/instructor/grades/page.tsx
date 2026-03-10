"use client"
 
import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Trophy, 
  Grape, 
  Database, 
  Globe, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight,
  MousePointer2,
  Sparkles,
  PieChart,
  Activity,
  UserCheck
} from "lucide-react"
import { cn } from "../../../lib/utils"
 
function GradesContent() {
  const [activeSegment, setActiveSegment] = useState("distribution")

  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Student Performance Hero ───────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Trophy className="w-80 h-80 -ml-20 -mb-20 rotate-12 text-indigo-600" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-[0.25em] border border-indigo-100/50">
                <Target className="w-4 h-4" />
                Performance Analytics
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                   Academic  <br />
                  <span className="text-indigo-600 font-serif italic tracking-tighter">Performance.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Analyze learner performance across all courses. Monitor grade trends, distribution curves, and academic thresholds through detailed visual reports.
                </p>
              </div>
            </div>

            {/* Context Stats */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group/m">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.1] group-hover/m:opacity-[0.2] transition-opacity">
                      <TrendingUp className="w-12 h-12" />
                   </div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">AVERAGE GPA</p>
                   <p className="text-[32px] font-black tracking-tighter tabular-nums text-white">3.82</p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ACADEMIC STANDING</p>
                   <p className="text-[32px] font-black tracking-tighter tabular-nums text-slate-900 leading-none">EXCELLENT</p>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Distribution Overview ─────────────────────────────────── */}
      <div className="bg-white rounded-[4rem] border border-slate-100 p-12 lg:p-20 shadow-sm relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center space-y-12">
          <div className="absolute top-0 right-0 p-20 opacity-[0.01]">
             <BarChart3 className="w-[40rem] h-[40rem]" />
          </div>

          <div className="space-y-8 relative z-10">
             <div className="relative mx-auto w-32 h-32">
                <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-32 h-32 rounded-[3.5rem] bg-slate-900 flex items-center justify-center border-[8px] border-white shadow-2xl">
                   <PieChart className="w-12 h-12 text-indigo-500" strokeWidth={3} />
                </div>
             </div>
             
             <div className="space-y-4 max-w-sm">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Ready to Analyze</h3>
                <p className="text-[17px] font-medium text-slate-400 leading-relaxed italic opacity-80">
                  The grade distribution engine is ready. Synchronize with the academic registry to view current performance curves.
                </p>
             </div>

             <button className="h-20 px-12 bg-indigo-600 text-white rounded-[2.5rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                <Sparkles className="w-6 h-6" />
                REFRESH GRADES
             </button>
          </div>
      </div>

      {/* ─── Key Performance Insights ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <InsightCard label="TOP SUBJECT" value="Adv. Quantum Theory" desc="Highest performing academic domain." />
         <InsightCard label="GPA STABILITY" value="98.2%" desc="Overall performance consistency across terms." />
         <InsightCard label="SUCCESS RATE" value="99.96%" desc="Percentage of students meeting mastery goals." />
      </div>
    </div>
  )
}
 
function InsightCard({ label, value, desc }: any) {
  return (
    <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm hover:scale-[1.02] transition-all cursor-default group">
       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 leading-none">{label}</p>
       <p className="text-[28px] font-black text-slate-900 tracking-tight leading-none mb-3 group-hover:text-indigo-600 transition-colors uppercase">{value}</p>
       <p className="text-[14px] font-bold text-slate-400 italic opacity-80">{desc}</p>
    </div>
  )
}
 
export default function InstructorGradesPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-16 w-16 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse italic">Synchronizing Performance Data</p>
       </div>
    }>
       <GradesContent />
    </Suspense>
  )
}
