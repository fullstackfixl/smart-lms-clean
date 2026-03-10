"use client"
 
import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, 
  Send, 
  Search, 
  Users, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight,
  MousePointer2,
  Database,
  Globe,
  Activity,
  UserPlus,
  Mail,
  Share2,
  Clock,
  MoreVertical,
  CheckCircle2
} from "lucide-react"
import { cn } from "../../../lib/utils"
 
function MessagesContent() {
  const [activeTab, setActiveTab] = useState("direct")
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Communication Center Hero ────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-50/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Share2 className="w-80 h-80 -ml-20 -mb-20 rotate-12 text-indigo-600" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-10 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.25em] border border-indigo-100/50">
                <MessageSquare className="w-4 h-4" />
                Instructor Communication Hub
              </div>
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Connect with <br />
                  <span className="text-indigo-600">Students.</span>
                </h1>
                <p className="text-[19px] font-bold text-slate-500 leading-relaxed max-w-xl opacity-80 italic">
                  Manage your instructional dialogue. Coordinate with students and faculty through professional messaging and collaborative channels.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button className="h-20 px-12 bg-slate-900 text-white rounded-[2.2rem] text-[15px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl group uppercase tracking-widest">
                  <UserPlus className="w-6 h-6 group-hover:rotate-12 transition-transform stroke-[3]" />
                  Start New Conversation
                </button>
                <div className="flex items-center gap-4 h-20 px-10 rounded-[2.2rem] border border-slate-100 bg-slate-50/50 shadow-inner backdrop-blur-sm">
                   <div className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(79,70,229,0.5)]" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hub Online</span>
                </div>
              </div>
            </div>
 
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-lg">
                <div className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group/m">
                   <div className="absolute top-0 right-0 p-6 opacity-[0.1] group-hover/m:opacity-[0.2] transition-opacity">
                      <Zap className="w-16 h-16 text-indigo-400" />
                   </div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Response Latency</p>
                   <p className="text-4xl font-black tracking-tighter tabular-nums text-white">OPTIMIZED</p>
                   <p className="text-[11px] text-slate-400 font-bold italic mt-2 opacity-60">High-speed message delivery</p>
                </div>
                <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                      <Users className="w-16 h-16 text-slate-900" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Threads</p>
                   <p className="text-5xl font-black tracking-tighter tabular-nums text-slate-900">00</p>
                   <p className="text-[11px] text-slate-400 font-bold italic mt-2 opacity-60">No pending messages</p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Main Interface ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[700px]">
        
        {/* Contacts Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-10 flex flex-col">
           <div className="relative group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" strokeWidth={3} />
              <input 
                placeholder="Search conversations..."
                className="w-full h-16 pl-16 pr-8 bg-slate-50/50 border border-slate-100 rounded-2xl text-[14px] font-black focus:ring-[8px] focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
              />
           </div>
 
           <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between px-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">// Active Discussions</h4>
                 <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   NO MESSAGES
                 </div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                 <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto border border-slate-100 opacity-60 shadow-sm">
                    <Database className="w-8 h-8 text-slate-300" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[13px] font-black text-slate-300 uppercase tracking-widest italic">Inventory Void</p>
                    <p className="text-[11px] text-slate-400 font-bold max-w-[180px] leading-relaxed mx-auto italic opacity-60">Your message registry is currently empty.</p>
                 </div>
              </div>
           </div>
        </div>
 
        {/* Chat Canvas Section */}
        <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col group/canvas">
           <div className="absolute top-0 right-0 p-24 opacity-[0.015] pointer-events-none group-hover/canvas:opacity-[0.03] transition-opacity duration-1000">
              <MessageSquare className="w-[45rem] h-[45rem] text-indigo-600" />
           </div>
 
           <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-12 relative z-10">
              <div className="relative">
                 <div className="absolute -inset-12 bg-indigo-500/10 rounded-full blur-[80px] animate-pulse" />
                 <div className="relative w-40 h-40 rounded-[3.5rem] bg-slate-900 flex items-center justify-center border-[10px] border-white shadow-2xl transition-transform duration-700 hover:scale-110 hover:rotate-3">
                    <MessageSquare className="w-16 h-16 text-indigo-500" strokeWidth={3} />
                 </div>
              </div>
              
              <div className="space-y-6 max-w-sm">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard Communication</h3>
                 <p className="text-[17px] font-bold text-slate-400 leading-relaxed italic opacity-80">
                   The secure messaging environment is currently on standby. Initialize a student contact to begin your professional dialogue.
                 </p>
              </div>
 
              <button className="h-20 px-14 bg-indigo-600 text-white rounded-[2.2rem] text-[14px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">
                 <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                 Initialize Dialogue
              </button>
           </div>
 
           {/* Restricted Input Bar */}
           <div className="p-12 border-t border-slate-50 bg-slate-50/30 flex gap-8 items-center">
              <div className="flex-1 h-20 bg-white border border-slate-100 rounded-3xl px-10 flex items-center text-slate-300 text-[14px] font-bold italic shadow-inner">
                 Select a student to authorize communication...
              </div>
              <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center text-white shadow-sm opacity-50 cursor-not-allowed">
                 <Send className="w-8 h-8" />
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
 
export default function InstructorMessagesPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[75vh] gap-10">
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
            <div className="h-20 w-20 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
          </div>
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.45em] animate-pulse italic text-center">Synchronizing Communication Hub...</p>
       </div>
    }>
       <MessagesContent />
    </Suspense>
  )
}
