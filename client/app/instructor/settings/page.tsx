"use client"
 
import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Shield,
  Bell,
  CreditCard,
  Building,
  Lock,
  Eye,
  Globe,
  Zap,
  CheckCircle2,
  ChevronRight,
  Database,
  Smartphone,
  Server,
  Key,
  ShieldCheck,
  Activity,
  User,
  Layout,
  Sparkles,
  ArrowUpRight,
  Bot,
  Terminal,
  Cpu
} from "lucide-react"
import { cn } from "../../../lib/utils"
 
function SettingsContent() {
  const [activeTab, setActiveTab] = useState("operational")
 
  const tabs = [
    { id: "operational", label: "Operational", icon: <Settings className="w-5 h-5" />, desc: "General parameters" },
    { id: "fiscal", label: "Fiscal", icon: <CreditCard className="w-5 h-5" />, desc: "Earnings & Payouts" },
    { id: "security", label: "Security", icon: <Lock className="w-5 h-5" />, desc: "Access protocols" },
    { id: "notifs", label: "Telemetry", icon: <Bell className="w-5 h-5" />, desc: "Alert configurations" },
  ]
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Control Center Hero ───────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.06] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-[#020617] p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05]">
             <Cpu className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                <Terminal className="w-4 h-4" />
                System Configuration
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  Operational <br />
                  <span className="text-indigo-400">Control Surface.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-400 leading-relaxed max-w-xl opacity-90">
                  Engineer your instructional environment. Manage fiscal endpoints, security protocols, and telemetry notifications through an elite executive console.
                </p>
              </div>
            </div>
 
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                   <div className="flex items-center gap-4 mb-4">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Global Integrity: HEALTHY</span>
                   </div>
                   <p className="text-white/40 text-[13px] font-bold italic leading-relaxed">System parameters are synchronized across all nodes. Last audit: 12ms ago.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Main Configuration Interface ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Navigation Rail */}
        <div className="lg:col-span-3 space-y-6">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "w-full h-24 rounded-[2rem] px-8 flex items-center gap-6 transition-all duration-500 text-left border relative group",
                 activeTab === tab.id 
                  ? "bg-white border-indigo-500 shadow-xl shadow-indigo-500/10" 
                  : "bg-transparent border-transparent hover:bg-slate-50 opacity-60 hover:opacity-100"
               )}
             >
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                  activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                )}>
                   {tab.icon}
                </div>
                <div>
                   <p className={cn("text-[16px] font-black tracking-tight leading-none mb-1.5", activeTab === tab.id ? "text-slate-900" : "text-slate-400")}>{tab.label}</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 opacity-60 leading-none">{tab.desc}</p>
                </div>
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-indicator" className="absolute right-6">
                    <div className="h-6 w-1 rounded-full bg-indigo-600" />
                  </motion.div>
                )}
             </button>
           ))}
        </div>
 
        {/* Active Surface */}
        <div className="lg:col-span-9">
           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white rounded-[3.5rem] border border-slate-100 p-12 lg:p-16 shadow-sm min-h-[600px] relative overflow-hidden"
              >
                {activeTab === 'operational' && (
                  <div className="space-y-12">
                     <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                        <div className="space-y-2">
                           <h3 className="text-3xl font-black text-slate-900 tracking-tight">General Operational Parameters</h3>
                           <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Core instructional environment settings</p>
                        </div>
                        <button className="h-14 px-8 bg-indigo-600 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                           COMMIT CHANGES
                        </button>
                     </div>
 
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <SettingToggle 
                          title="Peak AI Curriculum Generator" 
                          desc="Enable high-fidelity neural synthesis for curriculum architecture." 
                          enabled={true} 
                        />
                        <SettingToggle 
                          title="Global Telemetry Broadcast" 
                          desc="Synchronize real-time learner diagnostics across your cohort." 
                          enabled={true} 
                        />
                        <SettingToggle 
                          title="Auto-Audit Submissions" 
                          desc="Automatically execute precise diagnostics on scholar uploads." 
                          enabled={false} 
                        />
                        <SettingToggle 
                          title="Priority Satellite Uplink" 
                          desc="Ensure ultra-low latency for all live broadcast sessions." 
                          enabled={true} 
                        />
                     </div>
                  </div>
                )}
 
                {activeTab === 'fiscal' && (
                  <div className="space-y-12">
                     <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                        <div className="space-y-2">
                           <h3 className="text-3xl font-black text-slate-900 tracking-tight">Fiscal Intel & Payouts</h3>
                           <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Financial endpoints & capital distribution</p>
                        </div>
                        <div className="px-5 py-2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-black uppercase tracking-widest">
                           Verified Merchant
                        </div>
                     </div>
 
                     <div className="space-y-12">
                        <div className="p-10 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                           <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-3xl bg-white flex items-center justify-center shadow-sm">
                                 <Building className="w-8 h-8 text-indigo-600" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 leading-none">PRIMARY PAYOUT ENDPOINT</p>
                                 <p className="text-[20px] font-black text-slate-900 uppercase tracking-tighter tabular-nums">**** **** **** 8852</p>
                              </div>
                           </div>
                           <button className="text-indigo-600 text-[13px] font-black uppercase tracking-widest hover:underline">RECONFIGURE</button>
                        </div>
 
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <MetricItem label="Pending Capital" value="$12,480.00" color="blue" />
                           <MetricItem label="Total Extraction" value="$42,900.00" color="emerald" />
                           <MetricItem label="Next Payout" value="Oct 12, 2023" color="amber" />
                        </div>
                     </div>
                  </div>
                )}
 
                {activeTab === 'security' && (
                   <div className="space-y-12 text-center py-20">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-8 border border-slate-100">
                         <Lock className="w-10 h-10 text-slate-200" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">ENCRYPTED SURFACE</h3>
                      <p className="text-[16px] text-slate-400 max-w-sm mx-auto font-medium italic opacity-80 leading-relaxed">
                         Security protocols are currently managed by the global platform core. Direct reconfiguration is restricted for your role.
                      </p>
                      <button className="h-16 px-10 bg-slate-900 text-white rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                         REQUEST ELEVATION
                      </button>
                   </div>
                )}
 
                {activeTab === 'notifs' && (
                  <div className="space-y-12">
                     <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Telemetry Config</h3>
                        <Activity className="w-8 h-8 text-indigo-500 opacity-20" />
                     </div>
                     <div className="grid grid-cols-1 gap-6">
                        <SettingToggle title="Learner Milestone Alerts" desc="Receive signals when scholars achieve curriculum mastery." enabled={true} />
                        <SettingToggle title="Broadcast Schedule Reminders" desc="Temporal cues 15 minutes before global uplink." enabled={true} />
                        <SettingToggle title="Fiscal Transaction Reports" desc="Weekly intelligence summaries on capital flow." enabled={false} />
                        <SettingToggle title="Platform Integrity Alerts" desc="Critical signals regarding instructional uptime." enabled={true} />
                     </div>
                  </div>
                )}
              </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
 
function SettingToggle({ title, desc, enabled }: any) {
  const [isOn, setIsOn] = useState(enabled)
  return (
    <div className="p-8 rounded-[2.5rem] border border-slate-100 bg-white hover:border-indigo-200 transition-all group flex items-start justify-between gap-10">
       <div className="space-y-2">
          <p className="text-[18px] font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors uppercase">{title}</p>
          <p className="text-[13px] font-bold text-slate-400 italic leading-relaxed opacity-80">{desc}</p>
       </div>
       <button 
         onClick={() => setIsOn(!isOn)}
         className={cn(
           "h-10 w-20 rounded-full p-1.5 transition-all duration-500 shrink-0",
           isOn ? "bg-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-slate-100"
         )}
       >
          <div className={cn(
            "h-7 w-7 rounded-full bg-white shadow-md transition-all duration-500",
            isOn ? "translate-x-10" : "translate-x-0"
          )} />
       </button>
    </div>
  )
}
 
function MetricItem({ label, value, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  }
  return (
    <div className="p-8 rounded-[2.8rem] bg-white border border-slate-100 shadow-sm space-y-2 hover:scale-105 transition-all cursor-default">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
       <p className={cn("text-[26px] font-black tracking-tighter tabular-nums", colors[color].split(" ")[0])}>{value}</p>
       <div className={cn("h-1.5 w-12 rounded-full", colors[color].split(" ")[1])} />
    </div>
  )
}
 
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-16 w-16 border-[6px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Accessing Control Surface...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
