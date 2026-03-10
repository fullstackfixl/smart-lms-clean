"use client"

import { useState, Suspense } from "react"
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
  FileText,
  LayoutGrid,
  List
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { cn } from "../../../lib/utils"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'
 
function SubjectsContent() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <Book className="w-3.5 h-3.5" />
            Subject Management
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Academic Subjects</h1>
          <p className="text-sm text-slate-500 font-medium italic">Manage curricula, track student enrollment, and monitor academic load.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <Button 
            variant="outline"
            className="rounded-2xl h-14 px-8 border-slate-200 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Database className="w-4 h-4 stroke-[3]" />
            Sync Registry
          </Button>
        </div>
      </div>

      {/* ─── Search & View Control ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[3]" />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 w-full pl-14 pr-6 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 transition-all font-bold text-slate-900 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-3 rounded-xl bg-indigo-50 text-indigo-600 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
            <Clock className="w-4 h-4" />
            Current Load: 12 Units
          </div>
        </div>
      </div>

      {/* ─── Subject Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-2">
        <SubjectCard 
           code="CS302" 
           title="Neural Network Architecture" 
           students={124} 
           sessions={8}
           credits={4} 
        />
        <SubjectCard 
           code="PHY201" 
           title="Quantum Computing Systems" 
           students={86} 
           sessions={12}
           credits={3} 
        />
        <SubjectCard 
           code="MATH405" 
           title="Advanced Cryptography" 
           students={42} 
           sessions={6}
           credits={4} 
        />
      </div>
    </div>
  )
}

function SubjectCard({ code, title, students, sessions, credits }: any) {
  return (
    <SimpleCard className="group p-10 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[340px] rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5">
       <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-125 group-hover:rotate-12">
          <Layers className="w-32 h-32" />
       </div>

       <div className="space-y-8 relative z-10">
          <div className="flex items-center justify-between">
             <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                {code}
             </div>
             <div className="flex items-center gap-2 text-slate-400">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase">{credits} Units</span>
             </div>
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
             {title}
          </h3>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-5 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center text-center group-hover:bg-white transition-colors">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Learners</p>
                <p className="text-xl font-black text-slate-900 tabular-nums">{students}</p>
             </div>
             <div className="p-5 rounded-[1.5rem] bg-indigo-50/30 border border-indigo-100/50 flex flex-col items-center justify-center text-center group-hover:bg-indigo-50 transition-colors">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Modules</p>
                <p className="text-xl font-black text-indigo-600 tabular-nums">{sessions}</p>
             </div>
          </div>
       </div>

       <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
          <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-all flex items-center gap-2 group/btn">
             Course Details 
             <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
          </button>
          <div className="flex -space-x-3">
             {[1, 2, 3].map(i => (
               <div key={i} className="h-10 w-10 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm group-hover:border-indigo-50 transition-all">
                  {String.fromCharCode(64 + i)}
               </div>
             ))}
          </div>
       </div>
    </SimpleCard>
  )
}

export default function InstructorSubjectsPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
          <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Synchronizing Academic Registry...</p>
       </div>
    }>
       <SubjectsContent />
    </Suspense>
  )
}
