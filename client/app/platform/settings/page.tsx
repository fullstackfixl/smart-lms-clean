"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Settings, 
  Bell, 
  Lock, 
  Globe, 
  Shield, 
  Database, 
  Cpu, 
  Mail,
  Save,
  ChevronRight,
  Monitor,
  Key
} from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General")

  const tabs = [
    { id: "General", icon: <Settings className="w-4 h-4" /> },
    { id: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "System", icon: <Cpu className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Configuration</h1>
        <p className="text-slate-500 text-[13px] mt-1 font-medium">Global settings and system-wide parameters for the entire LMS ecosystem.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className={activeTab === tab.id ? 'text-white' : 'text-slate-400'}>
                {tab.icon}
              </div>
              {tab.id}
              {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">{activeTab} Settings</h3>
                <p className="text-[12px] text-slate-400 font-medium">Configure your platform's {activeTab.toLowerCase()} properties.</p>
              </div>
              <button className="flex items-center gap-2 px-5 py-2 bg-[#2563EB] text-white rounded-lg text-[12px] font-bold hover:bg-[#1d4ed8] transition-all shadow-sm shadow-blue-50">
                <Save className="w-3.5 h-3.5" />
                Commit Changes
              </button>
            </div>

            <div className="p-8 space-y-8">
              {activeTab === "General" && (
                <>
                  <SettingItem 
                    title="Platform Name" 
                    description="The main label used across the ecosystem and email templates."
                  >
                    <input 
                      type="text" 
                      defaultValue="Antigravity LMS"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[13px] font-medium text-slate-900 focus:bg-white focus:border-[#2563EB]/40 outline-none transition-all"
                    />
                  </SettingItem>

                  <SettingItem 
                    title="System Language" 
                    description="Default localization for platform administration."
                  >
                    <select className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-[#2563EB]/40 outline-none transition-all">
                      <option>English (International)</option>
                      <option>French (Standard)</option>
                      <option>Spanish (ES)</option>
                    </select>
                  </SettingItem>

                  <SettingItem 
                    title="Marketplace Visibility" 
                    description="Allow public browsing of courses without authentication."
                  >
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-4 h-4 text-slate-400" />
                        <span className="text-[13px] font-bold text-slate-700">Public Marketplace</span>
                      </div>
                      <div className="w-10 h-5 bg-[#2563EB] rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </SettingItem>
                </>
              )}

              {activeTab === "Security" && (
                 <div className="space-y-6">
                    <SettingItem 
                      title="Encryption Standard" 
                      description="Current platform-wide data at rest encryption."
                    >
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-[11px] font-bold w-fit">
                        <Shield className="w-3.5 h-3.5" />
                        AES-256 BIT INDUSTRIAL STRENGTH
                      </div>
                    </SettingItem>

                    <SettingItem 
                      title="Two-Factor Enforcement" 
                      description="Force all administrators to use 2FA for access."
                    >
                      <button className="w-full h-11 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <Key className="w-4 h-4" />
                        Manage Global MFA Policy
                      </button>
                    </SettingItem>
                 </div>
              )}

              {activeTab !== "General" && activeTab !== "Security" && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Cpu className="w-8 h-8 text-slate-200" />
                  </div>
                  <h4 className="text-[15px] font-bold text-slate-900">{activeTab} Modules</h4>
                  <p className="text-[13px] text-slate-500">Advanced configuration for this segment is coming in v2.4</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
             <div className="p-2 bg-white rounded-xl shadow-sm border border-amber-200">
                <Database className="w-5 h-5 text-amber-600" />
             </div>
             <div>
                <h4 className="text-[14px] font-bold text-amber-900">Database Consistency Check</h4>
                <p className="text-[12px] text-amber-700 font-medium mt-0.5">Automated backup is scheduled for 02:00 AM. Ensure all pending commits are finalized.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingItem({ title, description, children }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div>
        <h4 className="text-[14px] font-bold text-slate-900">{title}</h4>
        <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-1">{description}</p>
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
