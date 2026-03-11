"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  MoreHorizontal, 
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { MinimalModalForm } from '../../../components/platform/minimal-modal-form'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from '../../../lib/utils'
import { platformJsonFetcher } from '../../../lib/platform-fetcher'
import { PlatformErrorState } from '../../../components/platform/platform-error-state'

export default function StaffPage() {
  const [search, setSearch] = useState('')
  const { data: response, error, isLoading, mutate } = useSWR<any>(`/api/platform/staff?search=${search}`, platformJsonFetcher)

  if (error) {
    return <PlatformErrorState />
  }
  
  const staff = response?.data || []
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'platform_staff'
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/platform/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Staff member provisioned successfully")
        setIsModalOpen(false)
        setFormData({ name: '', email: '', password: '', role: 'platform_staff' })
        mutate()
      } else {
        toast.error(data.message || "Failed to provision staff")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'disable' : 'enable'
    try {
      const res = await fetch(`/api/platform/staff/${id}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Staff member ${action}d`)
        mutate()
      } else {
        toast.error(data.message || "Action failed")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            Platform Staff
          </h1>
          <p className="mt-2 text-slate-500">
            Commision and manage platform-level administrators and support guardians.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md px-6 shadow-none h-11"
        >
          <UserPlus className="mr-2 h-5 w-5 stroke-[3]" /> Create Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Total Guardians"
          value={staff.length}
          icon={ShieldCheck}
          subtitle="Platform level access"
        />
        <FlatMetricCard
          title="Active Staff"
          value={staff.filter((s: any) => s.isActive).length}
          icon={CheckCircle2}
          className="border-l-4 border-l-green-500"
          subtitle="Currently operational"
        />
        <FlatMetricCard
          title="Disabled"
          value={staff.filter((s: any) => !s.isActive).length}
          icon={XCircle}
          className="border-l-4 border-l-red-500"
          subtitle="Access revoked"
        />
      </div>

      {/* Main Content */}
      <section className="space-y-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 stroke-[2]" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
          />
        </div>

        <SimpleTable headers={['Guardian Name', 'Email Address', 'Privilege Role', 'Status', 'Actions']}>
          {staff.map((member: any) => (
            <SimpleTableRow key={member._id}>
              <SimpleTableCell className="font-bold text-blue-600">
                {member.name}
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="flex items-center text-slate-500">
                  <Mail className="mr-2 h-3.5 w-3.5 opacity-40" />
                  {member.email}
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                    {member.role.replace('platform_', '')}
                  </span>
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {member.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-none p-1">
                    <DropdownMenuItem 
                      onClick={() => handleStatusToggle(member._id, member.isActive ? 'active' : 'inactive')}
                      className={cn(
                        "cursor-pointer font-medium py-2",
                        member.isActive ? "text-orange-600 focus:bg-orange-50 focus:text-orange-700" : "text-green-600 focus:bg-green-50 focus:text-green-700"
                      )}
                    >
                      {member.isActive ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                      {member.isActive ? 'Revoke Access' : 'Grant Access'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => { if(confirm('Permanently delete?')) handleStatusToggle(member._id, 'delete') }}
                      className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Purge Guardian
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {staff.length === 0 && !isLoading && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={5} className="text-center py-12 text-slate-400">
                No platform staff identified in core registry.
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>

      {/* Create Staff Modal */}
      <MinimalModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Commission New Guardian"
        description="Provision platform-level administrative credentials for a new staff member."
        onSubmit={handleCreate}
        submitLabel="Initialize Guardian"
        loading={isSubmitting}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</Label>
            <Input 
              required 
              placeholder="e.g. Alex Rivera" 
              className="h-10 border-gray-300 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Network Email</Label>
            <Input 
              required 
              type="email" 
              placeholder="alex@smartlms.com" 
              className="h-10 border-gray-300 focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Access Passcode</Label>
            <Input 
              required 
              type="password"
              placeholder="••••••••" 
              className="h-10 border-gray-300 focus:border-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Privilege Level</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'platform_staff'})}
                className={cn(
                  "px-4 py-2 text-xs font-bold border rounded group transition-all",
                  formData.role === 'platform_staff' 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-gray-200 text-slate-500 hover:border-blue-500 hover:text-blue-600"
                )}
              >
                PLATFORM STAFF
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'platform_admin'})}
                className={cn(
                  "px-4 py-2 text-xs font-bold border rounded group transition-all",
                  formData.role === 'platform_admin' 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-gray-200 text-slate-500 hover:border-blue-500 hover:text-blue-600"
                )}
              >
                SUPER ADMIN
              </button>
            </div>
          </div>
        </div>
      </MinimalModalForm>
    </div>
  )
}
