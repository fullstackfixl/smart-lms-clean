"use client"

import { useState, Suspense } from "react"
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
  Cpu,
  CheckCircle,
  MoreVertical,
  Sliders
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'
import { cn } from "../../../lib/utils"
 
function SettingsContent() {
  const [activeTab, setActiveTab] = useState("general")
 
  const tabs = [
    { id: "general", label: "General", icon: <Sliders className="w-5 h-5" />, desc: "Course & platform settings" },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-5 h-5" />, desc: "Earnings & Payouts" },
    { id: "security", label: "Security", icon: <Lock className="w-5 h-5" />, desc: "Account security" },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-5 h-5" />, desc: "Alert preferences" },
  ]
 
  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <Settings className="w-3.5 h-3.5" />
            Instructor Dashboard
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-sm text-slate-500 font-medium italic">Configure your platform preferences, financial endpoints, and security protocols.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
             <ShieldCheck className="w-5 h-5 text-emerald-500 stroke-[2.5]" />
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Connection Secure</span>
          </div>
        </div>
      </div>

      {/* ─── Configuration Interface ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "w-full px-8 py-6 rounded-[2rem] flex items-center gap-5 transition-all duration-300 border group",
                 activeTab === tab.id 
                  ? "bg-white border-slate-200 shadow-lg shadow-slate-200/50" 
                  : "bg-transparent border-transparent text-slate-400 hover:bg-white hover:border-slate-100 hover:shadow-sm"
               )}
             >
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                  activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "bg-slate-100 text-slate-400"
                )}>
                   {tab.icon}
                </div>
                <div className="text-left">
                   <p className={cn("text-base font-black leading-none mb-1.5 uppercase tracking-tight", activeTab === tab.id ? "text-slate-900" : "text-slate-400")}>{tab.label}</p>
                   <p className="text-[10px] font-black text-slate-400 leading-none uppercase tracking-widest opacity-60">{tab.desc}</p>
                </div>
             </button>
           ))}
        </div>

        {/* Settings Surface */}
        <div className="lg:col-span-9">
            <SimpleCard className="p-12 min-h-[600px] border-slate-100 shadow-sm bg-white rounded-[2.5rem] animate-in fade-in duration-500">
                {activeTab === 'general' && (
                  <div className="space-y-12">
                     <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight">General Configuration</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Core instructional environment settings</p>
                        </div>
                        <Button className="h-12 px-8 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all">
                           Save Changes
                        </Button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SettingToggle 
                          title="AI Content Assist" 
                          desc="Enable AI assistance for curriculum building & assessments." 
                          enabled={true} 
                        />
                        <SettingToggle 
                          title="Real-time Analytics" 
                          desc="Synchronize real-time learner diagnostics across modules." 
                          enabled={true} 
                        />
                        <SettingToggle 
                          title="Automated Grading" 
                          desc="Enable auto-evaluation for standard quiz submissions." 
                          enabled={false} 
                        />
                        <SettingToggle 
                          title="High-Res Streaming" 
                          desc="Optimized bandwidth for live classroom sessions." 
                          enabled={true} 
                        />
                     </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-12">
                     <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight">Earnings & Settlements</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Financial endpoints & revenue tracking</p>
                        </div>
                        <SimpleBadge variant="green">
                           Verified Partner
                        </SimpleBadge>
                     </div>

                     <div className="space-y-12">
                        <div className="p-10 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-center justify-between group">
                           <div className="flex items-center gap-6">
                              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform duration-500">
                                 <Building className="w-7 h-7 text-indigo-600" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 leading-none">Primary Payout Method</p>
                                 <p className="text-xl font-black text-slate-900 tabular-nums tracking-tight">**** **** **** 8852</p>
                              </div>
                           </div>
                           <button className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline px-6 h-12 rounded-xl bg-white border border-indigo-100 shadow-sm">Edit Wallet</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <MetricItem label="Pending Transfers" value="$12,480" color="blue" />
                           <MetricItem label="Settled Revenue" value="$42,900" color="green" />
                           <MetricItem label="Net Disbursement" value="Oct 12" color="orange" />
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'security' && (
                   <div className="space-y-10 text-center py-20">
                      <div className="relative mx-auto w-24 h-24 mb-10">
                         <div className="absolute inset-0 bg-slate-900/5 rounded-full blur-2xl animate-pulse" />
                         <div className="relative w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                            <Lock className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                         </div>
                      </div>
                      <div className="space-y-4 max-w-sm mx-auto">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Security Protocol</h3>
                        <p className="text-sm text-slate-400 font-bold italic leading-relaxed opacity-80">
                           Advanced security configurations are managed by the institutional administrator.
                        </p>
                      </div>
                      <Button className="h-14 px-10 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">
                         Request Authority
                      </Button>
                   </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-12">
                     <div className="flex items-center justify-between pb-8 border-b border-slate-50">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight">Communication Alerts</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Platform notifications & system alerts</p>
                        </div>
                        <Activity className="w-6 h-6 text-indigo-500 opacity-20" />
                     </div>
                     <div className="grid grid-cols-1 gap-6">
                        <SettingToggle title="Performance Milestones" desc="Alerts when students reach significant academic goals." enabled={true} />
                        <SettingToggle title="Classroom Schedule" desc="Reminders before scheduled live instructional sessions." enabled={true} />
                        <SettingToggle title="Revenue Settlements" desc="Summaries regarding weekly course earnings & transfers." enabled={false} />
                        <SettingToggle title="Technical Integrity" desc="Alerts regarding platform updates & server status." enabled={true} />
                     </div>
                  </div>
                )}
            </SimpleCard>
        </div>
      </div>
    </div>
  )
}
 
function SettingToggle({ title, desc, enabled }: any) {
  const [isOn, setIsOn] = useState(enabled)
  return (
    <div className="p-8 rounded-[2rem] border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-100 transition-all group flex items-start justify-between gap-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
       <div className="space-y-2">
          <p className="text-sm font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{title}</p>
          <p className="text-[11px] font-black text-slate-400 italic leading-relaxed opacity-80">{desc}</p>
       </div>
       <button 
         onClick={() => setIsOn(!isOn)}
         className={cn(
           "h-8 w-14 rounded-full p-1.5 transition-all duration-300 shrink-0",
           isOn ? "bg-indigo-600 shadow-lg shadow-indigo-600/20" : "bg-slate-200"
         )}
       >
          <div className={cn(
            "h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300",
            isOn ? "translate-x-6" : "translate-x-0"
          )} />
       </button>
    </div>
  )
}
 
function MetricItem({ label, value, color }: any) {
  return (
    <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-3 hover:border-indigo-200 transition-all cursor-default group">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
       <div className="flex items-baseline gap-2">
          <p className={cn(
            "text-3xl font-black tracking-tighter tabular-nums",
            color === 'blue' ? "text-indigo-600" : color === 'green' ? "text-emerald-600" : "text-orange-600"
          )}>{value}</p>
       </div>
       <div className={cn(
         "h-1.5 w-10 rounded-full transition-all duration-500 group-hover:w-full",
         color === 'blue' ? "bg-indigo-100 group-hover:bg-indigo-600" : color === 'green' ? "bg-emerald-100 group-hover:bg-emerald-600" : "bg-orange-100 group-hover:bg-orange-600"
       )} />
    </div>
  )
}
 
export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
        <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic text-center">Synchronizing Configuration Hub...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
