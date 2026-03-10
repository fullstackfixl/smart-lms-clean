"use client"
 
import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Book, 
  GraduationCap, 
  Users, 
  Calendar, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Activity, 
  Sparkles,
  Search,
  Filter,
  ArrowUpRight,
  MousePointer2,
  Database,
  Layers,
  Target,
  FileText
} from "lucide-react"
import { cn } from "../../../lib/utils"
 
function SubjectsContent() {
  const [searchQuery, setSearchQuery] = useState("")
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Faculty Registry Hero ──────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-[#020617] p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05]">
              <Book className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                <Target className="w-4 h-4" />
                Faculty Academic Clusters
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  My <br />
                  <span className="text-indigo-400">Academic Hub.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-400 leading-relaxed max-w-xl opacity-90">
                  Orchestrate your assigned scholarly domains. Manage faculty records, curriculum alignments, and academic delivery for your core subjects within the institutional framework.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button className="h-20 px-12 bg-white text-slate-900 rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl group">
                  <Database className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  SYNC ACADEMIC DATA
                </button>
              </div>
            </div>
 
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                   <div className="flex items-center gap-4 mb-4">
                      <ShieldCheck className="w-6 h-6 text-indigo-400" />
                      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Faculty Status: ACTIVE</span>
                   </div>
                   <p className="text-white/40 text-[13px] font-bold italic leading-relaxed">Your professional records are synchronized with the central academic server.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Subject Matrix ─────────────────────────────────────────── */}
      <div className="space-y-12">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-4">
            <div className="relative flex-1 group max-w-2xl">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" strokeWidth={3} />
               <input 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Identify subject node..."
                 className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-[1.8rem] text-[14px] font-black focus:ring-[12px] focus:ring-indigo-500/5 transition-all shadow-sm"
               />
            </div>
            <div className="flex items-center gap-4">
               <div className="h-16 px-8 rounded-[1.5rem] bg-white border border-slate-100 flex items-center gap-4 text-slate-400 text-[11px] font-black uppercase tracking-widest shadow-sm">
                  <Clock className="w-5 h-5" />
                  Total Load: 12 Units
               </div>
            </div>
         </div>
 
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-4">
            <SubjectCard 
               code="CS302" 
               title="Neural Network Architecture" 
               scholars={124} 
               sessions={8}
               credits={4} 
            />
            <SubjectCard 
               code="PHY201" 
               title="Quantum Computing Systems" 
               scholars={86} 
               sessions={12}
               credits={3} 
            />
            <SubjectCard 
               code="MATH405" 
               title="Advanced Cryptography" 
               scholars={42} 
               sessions={6}
               credits={4} 
            />
         </div>
      </div>
    </div>
  )
}
 
function SubjectCard({ code, title, scholars, sessions, credits }: any) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer relative overflow-hidden"
    >
       <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity">
          <Layers className="w-24 h-24 -mr-4 -mt-4 rotate-12" />
       </div>
 
       <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
             <div className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[11px] font-black uppercase tracking-widest">
                {code}
             </div>
             <div className="flex items-center gap-2 text-slate-300">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-widest">{credits} CREDITS</span>
             </div>
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase group-hover:text-indigo-600 transition-colors">
             {title}
          </h3>
 
          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-50 space-y-1 shadow-inner">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SCHOLARS</p>
                <p className="text-[20px] font-black text-slate-900 tabular-nums">{scholars}</p>
             </div>
             <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-50 space-y-1 shadow-inner">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">SESSIONS</p>
                <p className="text-[20px] font-black text-indigo-600 tabular-nums">{sessions}</p>
             </div>
          </div>
 
          <div className="pt-4 flex items-center justify-between">
             <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2">
                VIEW REPOSITORY <ArrowUpRight className="w-4 h-4" />
             </button>
             <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-[3px] border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                     {i}
                  </div>
                ))}
             </div>
          </div>
       </div>
    </motion.div>
  )
}
 
export default function InstructorSubjectsPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-16 w-16 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse">Accessing Faculty Registry</p>
       </div>
    }>
       <SubjectsContent />
    </Suspense>
  )
}
