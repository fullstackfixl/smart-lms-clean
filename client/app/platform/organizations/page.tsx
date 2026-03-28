"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  Lock,
  Unlock
} from 'lucide-react'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { MinimalModalForm } from '../../../components/platform/minimal-modal-form'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from '../../../lib/utils'
import Link from 'next/link'
import { platformJsonFetcher } from '../../../lib/platform-fetcher'
import { PlatformErrorState } from '../../../components/platform/platform-error-state'
import { API_URL, getToken } from '../../../lib/config'

export default function OrganizationsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'COLLEGE',
    plan: 'basic',
    maxStudents: 1000,
    maxInstructors: 50
  })

  const { data: response, error, isLoading, mutate } = useSWR<any>(
    `/api/platform/organizations?search=${search}&status=${statusFilter === 'all' ? '' : statusFilter}`, 
    platformJsonFetcher
  )

  if (error) {
    return <PlatformErrorState />
  }

  const organizations = response?.data?.organizations || []
  const stats = response?.data?.stats || { total: 0, active: 0, suspended: 0 }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      type: 'COLLEGE',
      plan: 'basic',
      maxStudents: 1000,
      maxInstructors: 50
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/api/platform/organizations`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Organization created successfully")
        setIsCreateModalOpen(false)
        resetForm()
        mutate()
      } else {
        toast.error(data.message || "Failed to create organization")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrg) return
    setIsSubmitting(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/api/platform/organizations/${selectedOrg._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Organization updated successfully")
        setIsEditModalOpen(false)
        mutate()
      } else {
        toast.error(data.message || "Failed to update organization")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAction = async (id: string, action: string) => {
    try {
      const token = getToken()
      const res = await fetch(
        action === 'delete'
          ? `${API_URL}/api/platform/organizations/${id}`
          : `${API_URL}/api/platform/organizations/${id}/${action}`,
        {
          method: action === 'delete' ? 'DELETE' : 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        }
      )
      const data = await res.json()
      if (data.success) {
        toast.success(action === 'delete' ? 'Organization deleted successfully' : `Organization ${action}ed successfully`)
        mutate()
      } else {
        toast.error(data.message || `Failed to ${action} organization`)
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
            Organization Management
          </h1>
          <p className="mt-2 text-slate-500">
            Provision and oversee multi-tenant institutions across your global ecosystem.
          </p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md px-6 shadow-none h-11"
        >
          <Plus className="mr-2 h-5 w-5 stroke-[3]" /> Create Organization
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Total Institutions"
          value={stats?.total || 0}
          icon={Building2}
          subtitle="All registered nodes"
        />
        <FlatMetricCard
          title="Active Nodes"
          value={stats?.active || 0}
          icon={ShieldCheck}
          className="border-l-4 border-l-green-500"
          subtitle="Operational status"
        />
        <FlatMetricCard
          title="Suspended"
          value={stats?.suspended || 0}
          icon={AlertCircle}
          className="border-l-4 border-l-orange-500"
          subtitle="Access restricted"
        />
      </div>

      {/* Table Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-md border border-gray-200">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 stroke-[2]" />
            <input
              type="text"
              placeholder="Search by name, email, or subdomain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10 border-gray-300 focus:ring-0 focus:border-blue-500">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-none rounded-lg p-1">
              <SelectItem value="all" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-md py-2">Status: All</SelectItem>
              <SelectItem value="active" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-md py-2">Active</SelectItem>
              <SelectItem value="suspended" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-md py-2">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" className="text-slate-500 hover:text-blue-600 font-bold h-10 px-4">
            <Filter className="mr-2 h-4 w-4" /> More Filters
          </Button>
        </div>

        <SimpleTable headers={['Organization', 'Plan', 'Users', 'Status', 'Actions']}>
          {organizations.map((org: any) => (
            <SimpleTableRow key={org._id}>
              <SimpleTableCell>
                <div>
                  <Link 
                    href={`/platform/organizations/${org._id}`}
                    className="font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {org.name}
                  </Link>
                  <div className="text-xs text-slate-400 mt-0.5">{org.email}</div>
                  <div className="text-[10px] text-slate-300 font-mono mt-1 uppercase tracking-tighter">ID: {org.code || org._id.slice(-6)}</div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-orange-50 text-orange-600 border-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {org.plan}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-700">{org.usersCount || 0}</span> students
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  org.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {org.status}
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
                      onClick={() => {
                        setSelectedOrg(org);
                        setFormData({
                          name: org.name,
                          email: org.email,
                          type: org.type,
                          plan: org.plan,
                          maxStudents: org.limits?.max_students || 1000,
                          maxInstructors: org.limits?.max_instructors || 50
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="cursor-pointer text-slate-700 focus:bg-blue-50 focus:text-blue-600 py-2"
                    >
                      <Edit2 className="mr-2 h-4 w-4" /> Edit Parameters
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleAction(org._id, org.status === 'active' ? 'suspend' : 'activate')}
                      className={cn(
                        "cursor-pointer font-medium py-2",
                        org.status === 'active' ? "text-orange-600 focus:bg-orange-50 focus:text-orange-700" : "text-green-600 focus:bg-green-50 focus:text-green-700"
                      )}
                    >
                      {org.status === 'active' ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                      {org.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => { if(confirm('Delete org?')) handleAction(org._id, 'delete') }}
                      className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Suppress Node
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {organizations.length === 0 && !isLoading && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={6} className="text-center py-12 text-slate-400">
                No organizations match your query.
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>

      {/* Create Modal */}
      <MinimalModalForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Organization"
        description="Initialize a new institutional environment with dedicated student/instructor quotas."
        onSubmit={handleCreate}
        submitLabel="Create Institution"
        loading={isSubmitting}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Institution Name</Label>
            <Input 
              required 
              placeholder="e.g. Global Tech University" 
              className="h-11 border-gray-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all rounded-lg"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin Email</Label>
            <Input 
              required 
              type="email" 
              placeholder="admin@institution.edu" 
              className="h-11 border-gray-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all rounded-lg"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Org Type</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
              <SelectTrigger className="h-11 border-gray-200 bg-white text-slate-900 rounded-lg focus:ring-4 focus:ring-blue-50/50 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-none rounded-xl p-1">
                <SelectItem value="COLLEGE" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">College / University</SelectItem>
                <SelectItem value="SCHOOL" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">K-12 School</SelectItem>
                <SelectItem value="COACHING" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Institute / Coaching</SelectItem>
                <SelectItem value="CORPORATE" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Corporate Training</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">License Plan</Label>
            <Select value={formData.plan} onValueChange={(v) => setFormData({...formData, plan: v})}>
              <SelectTrigger className="h-11 border-gray-200 bg-white text-slate-900 rounded-lg focus:ring-4 focus:ring-blue-50/50 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-none rounded-xl p-1">
                <SelectItem value="basic" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Basic Tier</SelectItem>
                <SelectItem value="premium" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Premium Tier</SelectItem>
                <SelectItem value="enterprise" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Enterprise Tier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </MinimalModalForm>

      {/* Edit Modal */}
      <MinimalModalForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Institutional Parameters"
        description="Update license tiers and capacity limits for this institution."
        onSubmit={handleUpdate}
        submitLabel="Update Protocol"
        loading={isSubmitting}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Institution Name</Label>
            <Input 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="h-10 border-gray-300 focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Max Students</Label>
            <Input 
              type="number" 
              value={formData.maxStudents}
              onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})}
              className="h-10 border-gray-300 focus:border-blue-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Max Instructors</Label>
            <Input 
              type="number"
              value={formData.maxInstructors}
              onChange={(e) => setFormData({...formData, maxInstructors: parseInt(e.target.value)})}
              className="h-10 border-gray-300 focus:border-blue-500"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">License Tier</Label>
            <Select value={formData.plan} onValueChange={(v) => setFormData({...formData, plan: v})}>
              <SelectTrigger className="h-11 border-gray-200 bg-white text-slate-900 rounded-lg focus:ring-4 focus:ring-blue-50/50 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-none rounded-xl p-1">
                <SelectItem value="basic" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Basic - Core Features</SelectItem>
                <SelectItem value="premium" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Premium - Academic Layer</SelectItem>
                <SelectItem value="enterprise" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-3">Enterprise - Unlimited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </MinimalModalForm>
    </div>
  )

}
