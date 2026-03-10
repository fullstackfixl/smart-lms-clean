"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Award, 
  Download, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight
} from "lucide-react"

export default function CertificatesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const stats = [
    { label: "Certificates Issued", value: "2.4k", icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Students Certified", value: "1.8k", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Direct Downloads", value: "5.2k", icon: Download, color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none">Certificates</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-3">Design and issue professional credentials to recognized students.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                   <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
             </div>
             <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Templates List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search templates or students..."
                    className="w-full h-11 pl-11 pr-4 bg-slate-50 border-none rounded-lg text-[13px] font-bold focus:ring-2 focus:ring-blue-600/20"
                  />
               </div>
               <button className="h-11 px-4 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-500 hover:bg-slate-50">
                  Filters
               </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-center py-20 px-8">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Award className="w-10 h-10 text-slate-200" />
               </div>
               <h3 className="text-[18px] font-black text-slate-900 tracking-tight uppercase">Credentialing Engine Ready</h3>
               <p className="text-[14px] text-slate-500 font-medium mt-3 max-w-sm mx-auto">
                  Your organization's certificate issuing capabilities are active. Start by creating your first professional template.
               </p>
               <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all">
                  Get Started
               </button>
            </div>
         </div>

         {/* Sidebar Panel */}
         <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="text-[18px] font-black tracking-tight leading-tight uppercase">E-Verification</h4>
                  <p className="text-[12px] text-slate-400 font-medium mt-3 mb-6">Every certificate includes a unique QR code for instant blockchain-ready verification.</p>
                  <div className="flex items-center gap-2 text-blue-400 text-[11px] font-black uppercase tracking-widest">
                     Learn More <ArrowRight className="w-3 h-3" />
                  </div>
               </div>
               <Lock className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-800 opacity-20 group-hover:rotate-12 transition-transform" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
               <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Popular Templates
               </h4>
               <div className="space-y-3">
                  {["Professional Excellence", "Course Completion v2", "Academic Achievement"].map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                       <span className="text-[13px] font-bold text-slate-700">{t}</span>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
