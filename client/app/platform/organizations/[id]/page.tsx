"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Video,
  FileCheck,
  Award,
  Activity,
  Settings,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Shield,
  Search,
  MoreHorizontal,
  Download,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react'

import { FlatMetricCard } from '../../../../components/platform/flat-metric-card'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../../components/platform/simple-table'
import { BasicChart } from '../../../../components/platform/basic-chart'
import { Card } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Input } from '../../../../components/ui/input'
import { toast } from 'sonner'
import { cn } from '../../../../lib/utils'
import { platformJsonFetcher } from '../../../../lib/platform-fetcher'
import { PlatformErrorState } from '../../../../components/platform/platform-error-state'

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  // Data Fetching
  const { data: orgRes, error: orgError, isLoading: orgLoading, mutate: mutateOrg } = useSWR<any>(`/api/platform/organizations/${orgId}`, platformJsonFetcher)
  const { data: statsRes, isLoading: statsLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/stats`, platformJsonFetcher)
  const { data: studentsRes, isLoading: studentsLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/students`, platformJsonFetcher)
  const { data: instructorsRes, isLoading: instructorsLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/instructors`, platformJsonFetcher)
  const { data: coursesRes, isLoading: coursesLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/courses`, platformJsonFetcher)
  const { data: activityRes, isLoading: activityLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/activity`, platformJsonFetcher)
  const { data: liveRes, isLoading: liveLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/live-classes`, platformJsonFetcher)
  const { data: quizzesRes, isLoading: quizzesLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/quizzes`, platformJsonFetcher)
  const { data: certsRes, isLoading: certsLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/certificates`, platformJsonFetcher)
  const { data: attendanceRes, isLoading: attendanceLoading } = useSWR<any>(`/api/platform/organizations/${orgId}/attendance`, platformJsonFetcher)

  const org = orgRes?.data
  const stats = statsRes?.data
  const students = studentsRes?.data || []
  const instructors = instructorsRes?.data || []
  const courses = coursesRes?.data || []
  const activity = activityRes?.data || []
  const liveClasses = liveRes?.data || []
  const quizzes = quizzesRes?.data || []
  const certificates = certsRes?.data || []
  const attendance = attendanceRes?.data || []

  if (orgLoading) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </div>
  )

  if (orgError || !org) {
    return <PlatformErrorState title="Organization not found" message="This organization doesn't exist or is no longer available." />
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'instructors', label: 'Instructors', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'live', label: 'Live Classes', icon: Video },
    { id: 'attendance', label: 'Attendance', icon: FileCheck },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit text-slate-500 hover:text-blue-600 p-0 h-auto"
          onClick={() => router.push('/platform/organizations')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to organizations
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
              <Building2 className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">
                {org.name}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md shadow-none">
                  {org.type}
                </Badge>
                <div className="text-xs text-slate-400 font-medium font-mono uppercase">ID: {org.code || org._id}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="border-slate-200 bg-white shadow-none hover:bg-slate-50">
               <ExternalLink className="mr-2 h-4 w-4" /> Open site
             </Button>
             <Badge className={cn(
               "h-8 px-4 rounded-full flex items-center justify-center text-[11px] font-bold uppercase tracking-widest",
               org.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
             )}>
               {org.status}
             </Badge>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-4">
          <Card className="border-slate-200 bg-white p-2 rounded-xl">
            <div className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-colors",
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <tab.icon className={cn(
                    "h-4 w-4 stroke-[1.75]",
                    activeTab === tab.id ? "text-blue-700" : "text-slate-400"
                  )} />
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <main>
          {activeTab === 'overview' && <OverviewTab org={org} stats={stats} />}
          {activeTab === 'students' && <StudentsTab students={students} isLoading={studentsLoading} />}
          {activeTab === 'instructors' && <InstructorsTab instructors={instructors} isLoading={instructorsLoading} />}
          {activeTab === 'courses' && <CoursesTab courses={courses} isLoading={coursesLoading} />}
          {activeTab === 'live' && <LiveClassesTab data={liveClasses} isLoading={liveLoading} />}
          {activeTab === 'quizzes' && <QuizzesTab data={quizzes} isLoading={quizzesLoading} />}
          {activeTab === 'certificates' && <CertificatesTab data={certificates} isLoading={certsLoading} />}
          {activeTab === 'attendance' && <AttendanceTab data={attendance} isLoading={attendanceLoading} />}
          {activeTab === 'activity' && <ActivityTab activity={activity} isLoading={activityLoading} />}
          {activeTab === 'settings' && <SettingsTab org={org} mutate={mutateOrg} />}
        </main>
      </div>
    </div>
  )
}

function OverviewTab({ org, stats }: { org: any, stats: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <FlatMetricCard title="Enrollments" value={stats?.totalEnrollments || 0} icon={GraduationCap} subtitle="Total enrollments" />
        <FlatMetricCard title="Live classes" value={stats?.totalLiveClasses || 0} icon={Video} subtitle="Scheduled sessions" />
        <FlatMetricCard title="Certificates" value={stats?.certificatesIssued || 0} icon={Award} subtitle="Issued certificates" />
      </div>

      <Card className="p-8 border-slate-200 bg-white rounded-xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-900">Organization profile</h3>
          <Button variant="ghost" size="sm" className="text-blue-500 font-bold hover:bg-blue-50">
            <ExternalLink className="h-4 w-4 mr-2" /> View public site
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
          <ProfileItem label="Organization name" value={org.name} icon={Building2} />
          <ProfileItem label="Type" value={org.type || 'Standard'} icon={Shield} />
          <ProfileItem label="Email" value={org.email} icon={Mail} />
          <ProfileItem label="Phone" value={org.phone || 'Not set'} icon={Phone} />
          <ProfileItem label="Location" value={`${org.address?.city || ''}${org.address?.city && org.address?.country ? ', ' : ''}${org.address?.country || ''}` || 'Not set'} icon={MapPin} />
          <ProfileItem label="Website" value={org.website || 'Not set'} icon={Globe} link={org.website} />
          <ProfileItem label="Created on" value={org.created_at ? new Date(org.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'} icon={Calendar} />
          <ProfileItem label="Status" value={org.status} icon={Activity} />
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Description</h4>
          <p className="text-slate-600 text-sm leading-relaxed">
            {org.description || 'No description has been added for this organization yet.'}
          </p>
        </div>
      </Card>
    </div>
  )
}

function StudentsTab({ students, isLoading }: { students: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Students</h3>
        <Badge className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-none">
          {students.length}
        </Badge>
      </div>
      <SimpleTable headers={['Student', 'Email', 'Status']}>
        {isLoading ? (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">Loading...</SimpleTableCell>
          </SimpleTableRow>
        ) : students.length ? (
          students.map((s: any) => (
            <SimpleTableRow key={s._id || s.id}>
              <SimpleTableCell className="font-bold text-slate-900">{s.name || '—'}</SimpleTableCell>
              <SimpleTableCell className="text-slate-500">{s.email || '—'}</SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', s.isActive === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                  {s.isActive === false ? 'disabled' : 'active'}
                </Badge>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">No students found.</SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function InstructorsTab({ instructors, isLoading }: { instructors: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Instructors</h3>
        <Badge className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-none">
          {instructors.length}
        </Badge>
      </div>
      <SimpleTable headers={['Instructor', 'Email', 'Status']}>
        {isLoading ? (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">Loading...</SimpleTableCell>
          </SimpleTableRow>
        ) : instructors.length ? (
          instructors.map((i: any) => (
            <SimpleTableRow key={i._id || i.id}>
              <SimpleTableCell className="font-bold text-slate-900">{i.name || '—'}</SimpleTableCell>
              <SimpleTableCell className="text-slate-500">{i.email || '—'}</SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', i.isActive === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                  {i.isActive === false ? 'disabled' : 'active'}
                </Badge>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">No instructors found.</SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function CoursesTab({ courses, isLoading }: { courses: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Courses</h3>
        <Badge className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-none">
          {courses.length}
        </Badge>
      </div>
      <SimpleTable headers={['Course', 'Status', 'Enrollments']}>
        {isLoading ? (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">Loading...</SimpleTableCell>
          </SimpleTableRow>
        ) : courses.length ? (
          courses.map((c: any) => (
            <SimpleTableRow key={c._id || c.id}>
              <SimpleTableCell className="font-bold text-slate-900">{c.title || c.name || '—'}</SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', (c.status || c.state) === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                  {c.status || c.state || 'draft'}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="font-bold text-slate-700">{c.enrollmentCount || 0}</SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">No courses found.</SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function LiveClassesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Live classes</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : data.length ? (
          <div className="space-y-3">
            {data.map((x: any) => (
              <div key={x._id || x.id} className="flex items-center justify-between border border-slate-200 rounded-md p-4 bg-white">
                <div>
                  <div className="text-sm font-bold text-slate-900">{x.title || x.topic || 'Session'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{x.scheduledAt ? new Date(x.scheduledAt).toLocaleString() : '—'}</div>
                </div>
                <Badge className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-none">
                  {x.status || 'scheduled'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">No live classes found.</div>
        )}
      </div>
    </Card>
  )
}

function QuizzesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Quizzes</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : data.length ? (
          <div className="space-y-3">
            {data.map((q: any) => (
              <div key={q._id || q.id} className="flex items-center justify-between border border-slate-200 rounded-md p-4 bg-white">
                <div>
                  <div className="text-sm font-bold text-slate-900">{q.title || 'Quiz'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{q.questionsCount ? `${q.questionsCount} questions` : '—'}</div>
                </div>
                <Badge className="bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-none">
                  {q.status || 'active'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">No quizzes found.</div>
        )}
      </div>
    </Card>
  )
}

function CertificatesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Certificates</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : data.length ? (
          <div className="space-y-3">
            {data.map((c: any) => (
              <div key={c._id || c.id} className="flex items-center justify-between border border-slate-200 rounded-md p-4 bg-white">
                <div>
                  <div className="text-sm font-bold text-slate-900">{c.title || c.name || 'Certificate'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}</div>
                </div>
                <Button variant="outline" size="sm" className="h-9 border-slate-200 bg-white shadow-none font-bold">Download</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-400">No certificates found.</div>
        )}
      </div>
    </Card>
  )
}

function AttendanceTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Attendance</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : data.length ? (
          <div className="text-sm text-slate-600">Attendance records: <span className="font-bold text-slate-900">{data.length}</span></div>
        ) : (
          <div className="text-sm text-slate-400">No attendance data found.</div>
        )}
      </div>
    </Card>
  )
}

function ActivityTab({ activity, isLoading }: { activity: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Activity log</h3>
      </div>
      <SimpleTable headers={['Actor', 'Action', 'Time']}>
        {isLoading ? (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">Loading...</SimpleTableCell>
          </SimpleTableRow>
        ) : activity.length ? (
          activity.map((a: any) => (
            <SimpleTableRow key={a._id || a.id}>
              <SimpleTableCell className="font-bold text-slate-900">{a.actor?.name || a.user?.name || 'System'}</SimpleTableCell>
              <SimpleTableCell className="text-slate-500">{a.action || a.event || '—'}</SimpleTableCell>
              <SimpleTableCell className="text-slate-400 font-bold text-[10px] uppercase">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-12 text-center text-slate-400">No activity found.</SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function SettingsTab({ org, mutate }: { org: any; mutate: any }) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setActionLoading(action)
    try {
      const method = action === 'delete' ? 'DELETE' : action === 'reset-password' ? 'POST' : 'PATCH'
      const endpoint = action === 'reset-password' ? 'reset-admin-password' : action

      const res = await fetch(`/api/platform/organizations/${org._id}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()

      if (result.success) {
        toast.success(result.message || `Action ${action} completed.`)
        mutate()
      } else {
        toast.error(result.message || `Failed to ${action}.`)
      }
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-8 border-slate-200 bg-white rounded-xl">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" /> Organization status
        </h3>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Suspend organization</div>
              <div className="text-xs text-slate-500 mt-0.5">Temporarily stop access for all users in this organization.</div>
            </div>
            <Button
              variant={org.status === 'active' ? 'destructive' : 'outline'}
              className="font-bold shadow-none h-10 px-6 min-w-[140px]"
              disabled={actionLoading === 'suspend' || actionLoading === 'activate'}
              onClick={() => handleAction(org.status === 'active' ? 'suspend' : 'activate')}
            >
              {actionLoading === 'suspend' || actionLoading === 'activate' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : org.status === 'active' ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <Unlock className="mr-2 h-4 w-4" />
              )}
              {org.status === 'active' ? 'Suspend' : 'Activate'}
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Reset admin password</div>
              <div className="text-xs text-slate-500 mt-0.5">Send a password reset link to the organization admin.</div>
            </div>
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50 font-bold shadow-none h-10 px-6"
              disabled={actionLoading === 'reset-password'}
              onClick={() => handleAction('reset-password')}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', actionLoading === 'reset-password' && 'animate-spin')} />
              Send reset link
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between mt-8">
            <div>
              <div className="text-sm font-bold text-red-900">Delete organization</div>
              <div className="text-xs text-red-700 mt-0.5">Soft-delete this organization and disable all its users.</div>
            </div>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 font-bold shadow-none h-10 px-6"
              disabled={actionLoading === 'delete'}
              onClick={() => {
                if (confirm('Are you sure you want to delete this organization?')) handleAction('delete')
              }}
            >
              <Trash2 className={cn('mr-2 h-4 w-4', actionLoading === 'delete' && 'animate-spin')} />
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-8 border-slate-200 bg-white rounded-xl">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" /> Infrastructure Metadata
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Provisioned By</div>
            <div className="text-sm font-bold text-slate-900">{org.created_by?.name || 'Root System'}</div>
            <div className="text-xs text-slate-500 mt-0.5">{org.created_by?.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Last Protocol Update</div>
            <div className="text-sm font-bold text-slate-900">{org.updated_at ? new Date(org.updated_at).toLocaleString() : '—'}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ProfileItem({ label, value, icon: Icon, link }: { label: string; value: string; icon: any; link?: string }) {
  const content = link ? (
    <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">
      {value}
    </a>
  ) : (
    <div className="text-sm font-bold text-slate-900">{value}</div>
  )

  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="mt-1">{content}</div>
      </div>
    </div>
  )
}
