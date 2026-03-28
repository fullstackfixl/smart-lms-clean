"use client"

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Search,
  MoreHorizontal,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

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
import { cn } from '../../../lib/utils'
import { platformJsonFetcher } from '../../../lib/platform-fetcher'
import { platformApi } from '../../../lib/api'
import { PlatformErrorState } from '../../../components/platform/platform-error-state'
import { getToken } from '../../../lib/config'
import { useAuth } from '../../../lib/auth-context'

type StaffMember = {
  _id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  createdAt?: string
}

export default function StaffPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })

  const { data: response, error, isLoading, mutate } = useSWR<any>(
    `/api/platform/staff?search=${encodeURIComponent(search)}`,
    platformJsonFetcher
  )

  useEffect(() => {
    if (!user) return
    if (user.role !== 'platform_admin' && user.role !== ('platformAdmin' as any)) {
      router.replace('/platform/dashboard')
    }
  }, [router, user])

  if (error) {
    return <PlatformErrorState />
  }

  const staff: StaffMember[] = response?.data || []

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token) {
      toast.error('Missing platform token')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await platformApi.inviteStaff(token, formData)
      if (!res.success) throw new Error(res.error || 'Failed to send invitation')
      toast.success('Invitation sent successfully')
      setIsModalOpen(false)
      setFormData({ name: '', email: '' })
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    const token = getToken()
    if (!token) {
      toast.error('Missing platform token')
      return
    }

    try {
      const res = await platformApi.deactivateStaff(token, id)
      if (!res.success) throw new Error(res.error || 'Failed to deactivate')
      toast.success('Staff member deactivated')
      mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error')
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Staff</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Invite platform staff by email. Each invite expires in 24 hours and activates a secure staff account after acceptance.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="h-11 rounded-md bg-orange-500 px-6 font-bold text-white shadow-none hover:bg-orange-600"
        >
          <UserPlus className="mr-2 h-5 w-5 stroke-[3]" />
          Invite Staff
        </Button>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Total Staff"
          value={staff.length}
          icon={ShieldCheck}
          subtitle="Platform-level access"
        />
        <FlatMetricCard
          title="Active"
          value={staff.filter((s) => s.status === 'active').length}
          icon={CheckCircle2}
          className="border-l-4 border-l-green-500"
          subtitle="Operational accounts"
        />
        <FlatMetricCard
          title="Pending / Disabled"
          value={staff.filter((s) => s.status !== 'active').length}
          icon={XCircle}
          className="border-l-4 border-l-rose-500"
          subtitle="Needs attention"
        />
      </div>

      <section className="space-y-4">
        <label className="relative block max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-orange-500"
          />
        </label>

        <SimpleTable headers={['Name', 'Email', 'Role', 'Status', 'Actions']}>
          {staff.map((member) => (
            <SimpleTableRow key={member._id}>
              <SimpleTableCell className="font-semibold text-slate-900">{member.name}</SimpleTableCell>
              <SimpleTableCell>
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <Mail className="h-3.5 w-3.5 opacity-50" />
                  {member.email}
                </span>
              </SimpleTableCell>
              <SimpleTableCell>
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  {member.role.replace('platform_', '')}
                </span>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    member.status === 'active'
                      ? "bg-green-100 text-green-700"
                      : member.status === 'pending'
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  )}
                >
                  {member.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 border-slate-200 bg-white p-1 shadow-none">
                    <DropdownMenuItem
                      onClick={() => handleDeactivate(member._id)}
                      className="cursor-pointer py-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {staff.length === 0 && !isLoading && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={5} className="py-12 text-center text-slate-400">
                No platform staff found.
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>

      <MinimalModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite Platform Staff"
        description="Send a secure 24-hour invitation email to a new staff member."
        onSubmit={handleInvite}
        submitLabel="Send Invite"
        loading={isSubmitting}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</Label>
            <Input
              required
              placeholder="e.g. Alex Rivera"
              className="h-10 border-slate-300 focus:border-orange-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email</Label>
            <Input
              required
              type="email"
              placeholder="alex@smartlms.com"
              className="h-10 border-slate-300 focus:border-orange-500"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>
      </MinimalModalForm>
    </div>
  )
}
