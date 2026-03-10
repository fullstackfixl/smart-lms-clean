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
  Clock
} from "lucide-react"
import { cn } from "../../../lib/utils"
 
function MessagesContent() {
  const [activeTab, setActiveTab] = useState("direct")
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Strategic Communication Hero ────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-blue-50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Share2 className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black uppercase tracking-[0.25em] border border-blue-100/50">
                <MessageSquare className="w-4 h-4" />
                Strategic Uplink
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Scholar <br />
                  <span className="text-blue-600">Intersections.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Synchronize with your cohort. Facilitate neural knowledge transfer through elite strategic messaging and collaborative streams.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button className="h-20 px-12 bg-slate-900 text-white rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl group">
                  <UserPlus className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  INITIATE NEW UPLINK
                </button>
                <div className="flex items-center gap-3 h-20 px-8 rounded-[2.2rem] border border-slate-100 bg-slate-50 shadow-inner">
                   <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Hub Active</span>
                </div>
              </div>
            </div>
 
            {/* Macro Stats */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <div className="p-8 rounded-[2.5rem] bg-[#020617] text-white shadow-2xl relative overflow-hidden group/m">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.1] group-hover/m:opacity-[0.2] transition-opacity">
                      <Zap className="w-12 h-12" />
                   </div>
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">PULSE RATE</p>
                   <p className="text-[32px] font-black tracking-tighter tabular-nums text-white">12.4ms</p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ACTIVE CHANNELS</p>
                   <p className="text-[32px] font-black tracking-tighter tabular-nums text-slate-900">00</p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Communication Interface ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[600px]">
        
        {/* Contact Rail */}
        <div className="lg:col-span-4 bg-white rounded-[4rem] border border-slate-100 p-8 shadow-sm space-y-8">
           <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-blue-600 transition-colors" strokeWidth={3} />
              <input 
                placeholder="Identify scholar pulse..."
                className="w-full h-16 pl-16 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[14px] font-bold focus:ring-[8px] focus:ring-blue-500/5 focus:bg-white transition-all"
              />
           </div>
 
           <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">// Active Transmissions</h4>
                 <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-black">0 SECURED</Badge>
              </div>
              
              <div className="py-20 text-center space-y-6">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100 opacity-40">
                    <Database className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-[14px] font-bold text-slate-300 uppercase tracking-widest italic">Registry Void</p>
              </div>
           </div>
        </div>
 
        {/* Workspace Surface */}
        <div className="lg:col-span-8 bg-white rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col">
           <div className="absolute top-0 right-0 p-20 opacity-[0.01]">
              <MessageSquare className="w-[40rem] h-[40rem]" />
           </div>
 
           <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10 relative z-10">
              <div className="relative">
                 <div className="absolute -inset-8 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
                 <div className="relative w-32 h-32 rounded-[3.5rem] bg-[#020617] flex items-center justify-center border-[8px] border-white shadow-2xl">
                    <MessageSquare className="w-12 h-12 text-blue-500" strokeWidth={3} />
                 </div>
              </div>
              
              <div className="space-y-4 max-w-sm">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Uplink Standby</h3>
                 <p className="text-[17px] font-medium text-slate-400 leading-relaxed italic opacity-80">
                   The strategic communication sector is currently in standby. Initialize a new uplink to begin knowledge transfer.
                 </p>
              </div>
 
              <button className="h-20 px-12 bg-blue-600 text-white rounded-[2rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                 <Sparkles className="w-6 h-6" />
                 INITIATE PROTOCOL
              </button>
           </div>
 
           {/* Terminal Input Mock (Locked) */}
           <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex gap-6">
              <div className="flex-1 h-16 bg-white border border-slate-100 rounded-2xl px-8 flex items-center text-slate-200 text-[14px] font-bold italic">
                 Awaiting secure link authorization...
              </div>
              <div className="h-16 w-16 bg-slate-200 rounded-2xl flex items-center justify-center text-white">
                 <Send className="w-6 h-6" />
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
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-16 w-16 border-[6px] border-blue-500/10 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse">Synchronizing Communication Core</p>
       </div>
    }>
       <MessagesContent />
    </Suspense>
  )
}
