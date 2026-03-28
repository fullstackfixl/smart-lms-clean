"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, CalendarClock, Clock3, ListChecks, Search, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { platformApi } from '../../../lib/api'
import { getToken } from '../../../lib/config'
import { useAuth } from '../../../lib/auth-context'

type Application = {
  _id: string
  orgName?: string
  organization_name: string
  contactPerson?: string
  contact_person_name: string
  email?: string
  contact_email: string
  phone?: string
  contact_phone: string
  status: string
  priority?: 'hot' | 'warm' | 'cold'
  assignedTo?: { name?: string; email?: string } | null
  followUpAt?: string | null
  created_at: string
}

export default function PlatformStaffDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    if (user.role !== 'platform_staff') {
      router.replace('/platform/dashboard')
    }
  }, [router, user])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    let mounted = true
    setLoading(true)
    platformApi.listApplications(token, { limit: 100, assigned: 'all' })
      .then((res) => {
        if (!mounted) return
        if (!res.success) throw new Error(res.error || 'Failed to load applications')
        setApplications((res.data as any)?.applications || [])
      })
      .catch((error) => {
        if (mounted) toast.error(error instanceof Error ? error.message : 'Failed to load dashboard')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const summary = useMemo(() => {
    const filtered = applications.filter((item) => {
      const haystack = [
        item.orgName || item.organization_name,
        item.contactPerson || item.contact_person_name,
        item.email || item.contact_email,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(search.toLowerCase())
    })

    return {
      total: filtered.length,
      mine: filtered.filter((item) => item.assignedTo?.email === user?.email).length,
      hot: filtered.filter((item) => item.priority === 'hot').length,
      due: filtered.filter((item) => Boolean(item.followUpAt)).length,
      contacted: filtered.filter((item) => item.status === 'contacted').length,
    }
  }, [applications, search, user?.email])

  const visibleApplications = applications
    .filter((item) => {
      const haystack = [
        item.orgName || item.organization_name,
        item.contactPerson || item.contact_person_name,
        item.email || item.contact_email,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(search.toLowerCase())
    })
    .slice(0, 8)

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-500">CRM Workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Staff Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Track leads, follow-ups, and application activity from one light workspace.
          </p>
        </div>
        <Button
          asChild
          className="h-11 rounded-md bg-orange-500 px-5 font-bold text-white shadow-none hover:bg-orange-600"
        >
          <Link href="/platform-staff/applications">
            Open CRM <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 rounded-xl bg-slate-100" />
          <Skeleton className="h-32 rounded-xl bg-slate-100" />
          <Skeleton className="h-32 rounded-xl bg-slate-100" />
          <Skeleton className="h-32 rounded-xl bg-slate-100" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FlatMetricCard title="Open Leads" value={summary.total} icon={ListChecks} subtitle="Visible in your CRM" />
          <FlatMetricCard title="Assigned to Me" value={summary.mine} icon={Activity} subtitle="My active pipeline" />
          <FlatMetricCard title="Hot Leads" value={summary.hot} icon={Clock3} subtitle="High priority" />
          <FlatMetricCard title="Follow-Ups Due" value={summary.due} icon={CalendarClock} subtitle="Needs attention" />
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="relative block max-w-lg">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications, contacts, or emails..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white"
          />
        </label>
      </section>

      <Card className="border-slate-200 bg-white p-0 shadow-sm">
        <SimpleTable headers={['Organization', 'Contact', 'Priority', 'Status', 'Follow-up', 'Open']}>
          {visibleApplications.map((item) => (
            <SimpleTableRow key={item._id}>
              <SimpleTableCell className="font-semibold text-slate-900">
                {item.orgName || item.organization_name}
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="text-sm text-slate-600">
                  <div>{item.contactPerson || item.contact_person_name}</div>
                  <div className="text-xs text-slate-400">{item.email || item.contact_email}</div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {item.priority || 'warm'}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  {item.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-sm text-slate-600">
                {item.followUpAt ? new Date(item.followUpAt).toLocaleDateString() : 'None set'}
              </SimpleTableCell>
              <SimpleTableCell>
                <Button asChild variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                  <Link href={`/platform-staff/applications/${item._id}`}>Open</Link>
                </Button>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {visibleApplications.length === 0 && !loading && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={6} className="py-10 text-center text-slate-400">
                No applications found.
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </Card>
    </div>
  )
}
