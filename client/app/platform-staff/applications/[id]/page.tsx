"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, Mail, PencilLine, Phone, Plus, Shield, Tag, User2 } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { Card } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { platformApi } from '../../../../lib/api'
import { platformJsonFetcher } from '../../../../lib/platform-fetcher'
import { getToken } from '../../../../lib/config'

const statusOptions = ['contacted', 'negotiation', 'ready_for_approval']
const priorityOptions = ['hot', 'warm', 'cold'] as const

export default function PlatformStaffApplicationDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [status, setStatus] = useState('contacted')
  const [priority, setPriority] = useState<'hot' | 'warm' | 'cold'>('warm')
  const [loadingAction, setLoadingAction] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<any>(
    id ? `/api/platform/applications/${id}` : null,
    platformJsonFetcher
  )

  const application = data?.data?.application || data?.data || null

  useEffect(() => {
    if (application) {
      setStatus(application.status || 'contacted')
      setPriority(application.priority || 'warm')
      setFollowUp(application.followUpAt ? String(application.followUpAt).slice(0, 10) : '')
    }
  }, [application])

  const activity = useMemo(() => application?.activityLog || [], [application])
  const notes = useMemo(() => application?.notes || [], [application])

  const token = getToken()

  async function runAction(action: () => Promise<any>, successMessage: string) {
    if (!token) {
      toast.error('Missing platform token')
      return
    }
    setLoadingAction(true)
    try {
      const res = await action()
      if (!res.success) throw new Error(res.error || 'Action failed')
      toast.success(successMessage)
      await mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoadingAction(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Unable to load application.
      </div>
    )
  }

  if (isLoading || !application) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded bg-slate-100" />
        <div className="h-40 rounded-3xl bg-slate-100" />
        <div className="h-80 rounded-3xl bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" className="h-10 px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
          <Link href="/platform-staff/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to applications
          </Link>
        </Button>
        <Badge className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          {application.priority || 'warm'}
        </Badge>
      </div>

      <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {application.orgName || application.organization_name}
              </h1>
              <Badge className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                {application.status}
              </Badge>
            </div>
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-slate-400" />
                {application.contactPerson || application.contact_person_name}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                {application.email || application.contact_email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                {application.phone || application.contact_phone}
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-400" />
                {new Date(application.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
            <Button
              type="button"
              onClick={() => runAction(() => platformApi.claimApplication(token!, application._id), 'Application claimed')}
              className="h-11 rounded-md bg-orange-500 px-4 font-bold text-white shadow-none hover:bg-orange-600"
              disabled={loadingAction}
            >
              Claim
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => runAction(() => platformApi.updateApplicationPriority(token!, application._id, priority), 'Priority updated')}
              className="h-11 rounded-md border-slate-200 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50"
              disabled={loadingAction}
            >
              <Tag className="mr-2 h-4 w-4" />
              Save priority
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => runAction(() => platformApi.updateApplicationStatus(token!, application._id, status), 'Status updated')}
              className="h-11 rounded-md border-slate-200 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50"
              disabled={loadingAction}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Save status
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">CRM Controls</h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Shield className="h-4 w-4" />
              Staff access only
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-orange-500"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'hot' | 'warm' | 'cold')}
                className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-orange-500"
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Follow-up date</label>
            <Input
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="h-11 border-slate-200 bg-slate-50 focus:border-orange-500"
            />
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Note or call log</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Summarize the call, outreach, or next step..."
              className="min-h-28 border-slate-200 bg-slate-50 focus:border-orange-500"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => runAction(() => platformApi.addApplicationNote(token!, application._id, { text: note, type: 'note' }), 'Note added')}
              className="h-11 rounded-md bg-blue-600 px-4 font-bold text-white shadow-none hover:bg-blue-700"
              disabled={loadingAction || !note.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add note
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => runAction(() => platformApi.contactApplication(token!, application._id, { contact_notes: note, follow_up_date: followUp || undefined }), 'Contact logged')}
              className="h-11 rounded-md border-slate-200 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50"
              disabled={loadingAction}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Log contact
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => runAction(() => platformApi.setApplicationFollowUp(token!, application._id, followUp || null), 'Follow-up updated')}
              className="h-11 rounded-md border-slate-200 bg-white px-4 font-bold text-slate-700 hover:bg-slate-50"
              disabled={loadingAction}
            >
              <Clock3 className="mr-2 h-4 w-4" />
              Save follow-up
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Notes</h2>
            <div className="mt-4 space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-slate-400">No notes yet.</p>
              ) : (
                notes.map((entry: any) => (
                  <div key={entry._id || entry.created_at} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{entry.type || 'note'}</span>
                      <span className="text-xs text-slate-400">{entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{entry.text}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
            <div className="mt-4 space-y-3">
              {activity.length === 0 ? (
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                activity.map((entry: any) => (
                  <div key={entry._id || entry.created_at} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{entry.action}</span>
                      <span className="text-xs text-slate-400">{entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {entry.details ? JSON.stringify(entry.details) : 'No details'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
