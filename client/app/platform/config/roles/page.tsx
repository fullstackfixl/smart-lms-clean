"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Shield, 
  UserCheck, 
  Lock, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck
} from "lucide-react"

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState("Platform Admin")

  const roles = [
    { id: "platform_admin", name: "Platform Admin", description: "Full system access across all organizations and platform settings." },
    { id: "org_admin", name: "Organization Admin", description: "Complete control over a specific organization's users and content." },
    { id: "instructor", name: "Instructor", description: "Can create and manage courses within their assigned organization." },
    { id: "student", name: "Student", description: "Access to learning materials and performance tracking." },
  ]

  const permissions = [
    { category: "Global Control", items: ["System Configuration", "Audit Logs", "API Management"] },
    { category: "Organization", items: ["Create Organizations", "Manage Subscriptions", "Domain Mapping"] },
    { category: "User Management", items: ["Invite Admins", "Suspend Users", "Role Assignment"] },
    { category: "Analytics", items: ["Revenue Reports", "Traffic Analysis", "Global Stats"] },
  ]

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Roles</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Define access levels and system permissions for the platform ecosystem.</p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-[13px] font-bold hover:bg-[#1d4ed8] transition-all shadow-sm shadow-blue-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Roles List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Available System Roles</h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.name)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedRole === role.name
                      ? 'bg-white border-[#2563EB] shadow-md shadow-blue-50'
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[13px] font-bold ${selectedRole === role.name ? 'text-[#2563EB]' : 'text-slate-900'}`}>
                      {role.name}
                    </span>
                    {selectedRole === role.name && <ShieldCheck className="w-4 h-4 text-[#2563EB]" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-medium">{role.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg border border-blue-200">
              <AlertCircle className="w-4 h-4 text-[#2563EB]" />
            </div>
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed mt-0.5">
              System roles are hardcoded for maximum security. Custom roles can only inherit from these base types.
            </p>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Permission Matrix</h3>
                <p className="text-[11px] text-slate-400 font-medium">Fine-tune capabilities for the <span className="text-[#2563EB] font-bold">{selectedRole}</span> role.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-2" />
                <button className="p-2 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {permissions.map((cat) => (
                  <div key={cat.category} className="space-y-4">
                    <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                      {cat.category}
                    </h4>
                    <div className="space-y-3">
                      {cat.items.map((item) => (
                        <div key={item} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-[#2563EB]/20 transition-all">
                          <span className="text-[12px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item}</span>
                          <div className="flex items-center gap-2 transition-all">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Enabled</span>
                            <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                              <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between mt-auto">
               <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Lock className="w-3 h-3" />
                  Last modified by System at 01:22 PM
               </div>
               <button className="px-5 py-2 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-black transition-all">
                  Synchronize Access
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
