"use client"
 
import React, { useState } from "react"
import { 
  Zap, 
  Smartphone, 
  Video, 
  FileText, 
  ShieldCheck, 
  Search, 
  Plus, 
  ExternalLink,
  ChevronRight,
  Monitor,
  Globe,
  Mail,
  ArrowUpRight
} from "lucide-react"
import { SimpleCard } from "../../../components/platform/core/SimpleCard"
import { SimpleButton } from "../../../components/platform/core/SimpleButton"
import { cn } from "../../../lib/utils"
 
const apps = [
  { id: "mobile", name: "Mobile App (iOS/Android)", category: "Mobile", status: "Active", icon: <Smartphone className="w-5 h-5" />, desc: "White-labeled native mobile experience for students." },
  { id: "video", name: "Premium Video Suite", category: "Infrastructure", status: "Active", icon: <Video className="w-5 h-5" />, desc: "DRM-protected video hosting and adaptive streaming." },
  { id: "exam", name: "Advanced Exam Engine", category: "LMS", status: "Install", icon: <FileText className="w-5 h-5" />, desc: "Complex assessment protocols with AI proctoring." },
  { id: "marketing", name: "Marketing Automator", category: "Growth", status: "Install", icon: <Mail className="w-5 h-5" />, desc: "Universal email and notification orchestration." },
  { id: "hosting", name: "Custom Domain Hosting", category: "Infrastructure", status: "Active", icon: <Globe className="w-5 h-5" />, desc: "Subdomain and custom CNAME orchestration." },
]
 
export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
 
  const filtered = apps.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
               Platform <span className="text-[#3B82F6] underline decoration-2 underline-offset-8">Applications.</span>
            </h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Universal application ecosystem. Deploy custom nodes for elite functionality.</p>
         </div>
         <SimpleButton variant="secondary">
            <Plus className="w-4 h-4 mr-2" strokeWidth={2.5} />
            Build Custom App
         </SimpleButton>
      </div>
 
      {/* ─── Search Explorer ───────────────────────────────────────── */}
      <div className="relative group max-w-xl">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#3B82F6]" strokeWidth={2} />
         <input 
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           placeholder="Search platform apps..."
           className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-md text-[13.5px] font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all"
         />
      </div>
 
      {/* ─── App Catalog ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filtered.map((app) => (
            <SimpleCard key={app.id} noPadding className="group flex flex-col h-full hover:border-[#3B82F6]/30 transition-all duration-300">
               <div className="p-8 space-y-6 flex-1">
                  <div className="flex items-start justify-between">
                     <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                        {app.icon}
                     </div>
                     <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        app.status === 'Active' ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-[#3B82F6] border-blue-100"
                     )}>
                        {app.status === 'Active' ? 'ACTIVE' : 'INSTALL'}
                     </span>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-[17px] font-bold text-slate-900">{app.name}</h3>
                     <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{app.desc}</p>
                  </div>
               </div>
               <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between bg-[#F8FAFC]/30">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{app.category}</div>
                  <button className="text-[13px] font-bold text-[#3B82F6] hover:underline flex items-center gap-1.5">
                     Open App <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </SimpleCard>
         ))}
      </div>
 
      {/* ─── Developer Portal ─────────────────────────────────────── */}
      <div className="p-8 border border-dashed border-gray-200 rounded-md flex items-center justify-between gap-6 bg-gray-50/50">
         <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-400">
               <Monitor className="w-6 h-6" />
            </div>
            <div className="space-y-1">
               <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">Access the Developer Sandbox</h4>
               <p className="text-[13px] text-slate-500 font-medium italic">Prototype and deploy your own nodes into the Smart LMS ecosystem.</p>
            </div>
         </div>
         <SimpleButton variant="outline">
            Developer Hub
         </SimpleButton>
      </div>
 
    </div>
  )
}
