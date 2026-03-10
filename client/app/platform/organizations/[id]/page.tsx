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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  // Data Fetching
  const { data: orgRes, error: orgError, isLoading: orgLoading, mutate: mutateOrg } = useSWR(`/api/platform/organizations/${orgId}`, fetcher)
  const { data: statsRes, isLoading: statsLoading } = useSWR(`/api/platform/organizations/${orgId}/stats`, fetcher)
  const { data: studentsRes, isLoading: studentsLoading } = useSWR(`/api/platform/organizations/${orgId}/students`, fetcher)
  const { data: instructorsRes, isLoading: instructorsLoading } = useSWR(`/api/platform/organizations/${orgId}/instructors`, fetcher)
  const { data: coursesRes, isLoading: coursesLoading } = useSWR(`/api/platform/organizations/${orgId}/courses`, fetcher)
  const { data: activityRes, isLoading: activityLoading } = useSWR(`/api/platform/organizations/${orgId}/activity`, fetcher)
  const { data: liveRes, isLoading: liveLoading } = useSWR(`/api/platform/organizations/${orgId}/live-classes`, fetcher)
  const { data: quizzesRes, isLoading: quizzesLoading } = useSWR(`/api/platform/organizations/${orgId}/quizzes`, fetcher)
  const { data: certsRes, isLoading: certsLoading } = useSWR(`/api/platform/organizations/${orgId}/certificates`, fetcher)
  const { data: attendanceRes, isLoading: attendanceLoading } = useSWR(`/api/platform/organizations/${orgId}/attendance`, fetcher)

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
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-lg font-bold text-slate-900">Organization not found</h3>
        <p className="text-sm text-slate-500">This organization doesn&apos;t exist or is no longer available.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    )
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
            <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm shadow-slate-100">
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
          <Card className="border-slate-200 bg-white p-2 rounded-xl shadow-sm shadow-slate-100/60">
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <FlatMetricCard title="Enrollments" value={stats?.totalEnrollments || 0} icon={GraduationCap} subtitle="Total enrollments" />
        <FlatMetricCard title="Live classes" value={stats?.totalLiveClasses || 0} icon={Video} subtitle="Scheduled sessions" />
        <FlatMetricCard title="Certificates" value={stats?.certificatesIssued || 0} icon={Award} subtitle="Issued certificates" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
           <Card className="p-8 border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60">
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
                <ProfileItem label="Location" value={`${org.address?.city || ''}${org.address?.city && org.address?.country ? ', ' : ''}${org.address?.country || ''}`} icon={MapPin} />
                <ProfileItem label="Website" value={org.website || 'Not set'} icon={Globe} link={org.website} />
                <ProfileItem label="Created on" value={new Date(org.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })} icon={Calendar} />
                <ProfileItem label="Status" value={org.status} icon={Activity} />
             </div>

             <div className="mt-12 pt-8 border-t border-gray-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Description</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {org.description || "No description has been added for this organization yet."}
                </p>
             </div>
           </Card>
        </div>

        <div className="space-y-8">
           <Card className="p-8 border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Organization admin</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                       {org.admin_user_id?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                       <div className="font-bold text-slate-900">{org.admin_user_id?.name || "Unassigned"}</div>
                       <div className="text-xs text-slate-500 font-medium">Primary administrator</div>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                       <Mail className="h-4 w-4 opacity-40" />
                       <span className="truncate">{org.admin_user_id?.email || "No email linked"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                       <Phone className="h-4 w-4 opacity-40" />
                       <span>{org.admin_user_id?.phone || "No phone linked"}</span>
                    </div>
                 </div>
                 <Button className="w-full bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-none font-bold" variant="outline">
                    Email admin
                 </Button>
              </div>
           </Card>

           <Card className="p-8 border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Overview</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                       <Users className="h-4 w-4 opacity-40" /> Instructors
                    </div>
                    <span className="font-bold text-slate-900">{stats?.totalInstructors || 0}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                       <GraduationCap className="h-4 w-4 opacity-40" /> Students
                    </div>
                    <span className="font-bold text-slate-900">{stats?.totalStudents || 0}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                       <BookOpen className="h-4 w-4 opacity-40" /> Courses
                    </div>
                    <span className="font-bold text-slate-900">{stats?.totalCourses || 0}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                       <BookOpen className="h-4 w-4 opacity-40" /> Quizzes
                    </div>
                    <span className="font-bold text-slate-900">{stats?.totalQuizzes || 0}</span>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}

function ProfileItem({ label, value, icon: Icon, link }: { label: string, value: string, icon: any, link?: string }) {
  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
        <Icon className="h-5 w-5 stroke-[1.5]" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</div>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline truncate block">
            {value}
          </a>
        ) : (
          <div className="text-sm font-bold text-slate-900 truncate">{value}</div>
        )}
      </div>
    </div>
  )
}

function StudentsTab({ students, isLoading }: { students: any[], isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Students</h3>
        <div className="flex gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder="Search students..." className="h-9 w-56 md:w-64 bg-white pl-9 text-xs border-slate-200" />
           </div>
           <Button variant="outline" size="sm" className="h-9 font-bold border-slate-200 bg-white shadow-none hover:bg-slate-50">
              <Download className="h-3.5 w-3.5 mr-2" /> Export
           </Button>
        </div>
      </div>
      <SimpleTable headers={['Student', 'Email', 'Status', 'Joined', 'Actions']}>
        {isLoading ? (
          [1,2,3].map(i => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={6}><Skeleton className="h-12 w-full" /></SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : students.length > 0 ? (
          students.map((student: any) => (
            <SimpleTableRow key={student._id}>
              <SimpleTableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 flex items-center justify-center shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{student.name}</div>
                    <div className="text-[10px] text-slate-400">{student.email}</div>
                  </div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="text-xs text-slate-600">{student.email}</SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  {student.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600">
                   <MoreHorizontal className="h-4 w-4" />
                </Button>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
             <SimpleTableCell colSpan={6} className="text-center py-20 text-slate-400">
                No students found for this organization.
             </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function InstructorsTab({ instructors, isLoading }: { instructors: any[], isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Instructors</h3>
        <Button variant="outline" size="sm" className="h-9 font-bold border-slate-200 bg-white shadow-none hover:bg-slate-50">
          <Download className="h-3.5 w-3.5 mr-2" /> Export
        </Button>
      </div>
      <SimpleTable headers={['Instructor', 'Email', 'Status', 'Actions']}>
        {isLoading ? (
          [1,2,3].map(i => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={6}><Skeleton className="h-12 w-full" /></SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : instructors.length > 0 ? (
          instructors.map((instructor: any) => (
            <SimpleTableRow key={instructor._id}>
              <SimpleTableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-50 text-[10px] font-bold text-orange-600 flex items-center justify-center shrink-0">
                    {instructor.name.charAt(0)}
                  </div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">{instructor.name}</div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="text-xs text-slate-500">{instructor.email}</SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  {instructor.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600">
                   <MoreHorizontal className="h-4 w-4" />
                </Button>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
             <SimpleTableCell colSpan={6} className="text-center py-20 text-slate-400">
                No instructors found for this organization.
             </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function CoursesTab({ courses, isLoading }: { courses: any, isLoading: boolean }) {
  const data = courses?.data || []
  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Courses</h3>
        <Button variant="outline" size="sm" className="h-9 font-bold border-slate-200 bg-white shadow-none hover:bg-slate-50">
          <Download className="h-3.5 w-3.5 mr-2" /> Export
        </Button>
      </div>
      <SimpleTable headers={['Course', 'Instructor', 'Status', 'Actions']}>
        {isLoading ? (
          [1,2,3].map(i => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={6}><Skeleton className="h-12 w-full" /></SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : data.length > 0 ? (
          data.map((course: any) => (
            <SimpleTableRow key={course._id}>
              <SimpleTableCell>
                <div className="font-bold text-blue-600 text-sm">{course.title}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-tighter">ID: {course._id.slice(-8)}</div>
              </SimpleTableCell>
              <SimpleTableCell className="text-xs font-medium text-slate-600">{course.instructor_id?.name || 'Not set'}</SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  course.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                )}>
                  {course.status || (course.isPublished ? 'published' : 'draft')}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600">
                   <MoreHorizontal className="h-4 w-4" />
                </Button>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
             <SimpleTableCell colSpan={6} className="text-center py-20 text-slate-400">
                Course inventory is currently empty for this node.
             </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function ActivityTab({ activity, isLoading }: { activity: any; isLoading: boolean }) {
  const data = activity?.data || []

  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Activity log</h3>
        <Button variant="ghost" size="sm" className="h-9 font-bold text-blue-600 hover:bg-blue-50">
          <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
        </Button>
      </div>
      <SimpleTable headers={['Event', 'User', 'Action', 'Time']}>
        {isLoading &&
          [1, 2, 3].map((i) => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={4}>
                <Skeleton className="h-12 w-full" />
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading &&
          data.map((log: any) => (
            <SimpleTableRow key={log._id}>
              <SimpleTableCell>
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  LOG-{log._id.slice(-6)}
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="text-xs font-bold text-slate-900">{log.user_id?.name || 'System'}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-tighter">
                  {log.user_role}
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-none">
                  {log.action}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-[10px] text-slate-400 font-bold uppercase">
                {new Date(log.timestamp).toLocaleString()}
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading && data.length === 0 && (
          <SimpleTableRow>
            <SimpleTableCell colSpan={4} className="text-center py-20 text-slate-400">
              No activity recorded yet.
            </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function LiveClassesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const hasData = !isLoading && Array.isArray(data) && data.length > 0

  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Live classes</h3>
      </div>

      <SimpleTable headers={['Session Title', 'Instructor', 'Course', 'Scheduled At', 'Status']}>
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={5}>
                <Skeleton className="h-10 w-full" />
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : hasData ? (
          data.map((session: any) => (
            <SimpleTableRow key={session._id}>
              <SimpleTableCell className="font-bold text-sm">{session.title}</SimpleTableCell>
              <SimpleTableCell className="text-xs">
                {session.instructor_id?.name || 'Academic System'}
              </SimpleTableCell>
              <SimpleTableCell className="text-xs">{session.course_id?.title || 'N/A'}</SimpleTableCell>
              <SimpleTableCell className="text-xs">
                {new Date(session.scheduled_at).toLocaleString()}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-blue-50 text-blue-600 rounded-full text-[10px] uppercase font-bold">
                  {session.status}
                </Badge>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
            <SimpleTableCell colSpan={5} className="text-center py-10 text-slate-400">
              No live classes yet.
            </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function QuizzesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Quizzes</h3>
      </div>
      <SimpleTable headers={['Quiz Title', 'Course', 'Questions', 'Status']}>
        {isLoading &&
          [1, 2, 3].map((i) => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={4}>
                <Skeleton className="h-10 w-full" />
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading &&
          data.map((quiz: any) => (
            <SimpleTableRow key={quiz._id}>
              <SimpleTableCell className="font-bold text-sm">{quiz.title}</SimpleTableCell>
              <SimpleTableCell className="text-xs">{quiz.course_id?.title || 'N/A'}</SimpleTableCell>
              <SimpleTableCell className="text-xs">
                {quiz.questions?.length || 0} Items
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-slate-100 text-slate-600 rounded-full text-[10px] uppercase font-bold">
                  {quiz.status || 'Active'}
                </Badge>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading && data.length === 0 && (
          <SimpleTableRow>
            <SimpleTableCell colSpan={4} className="text-center py-10 text-slate-400">
              No quizzes found.
            </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function CertificatesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Certificates</h3>
      </div>
      <SimpleTable headers={['Recipient', 'Course', 'Issued Date', 'Grade']}>
        {isLoading &&
          [1, 2, 3].map((i) => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={4}>
                <Skeleton className="h-10 w-full" />
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading &&
          data.map((cert: any) => (
            <SimpleTableRow key={cert._id}>
              <SimpleTableCell className="font-bold text-sm">
                {cert.user_id?.name || 'N/A'}
              </SimpleTableCell>
              <SimpleTableCell className="text-xs">
                {cert.course_id?.title || 'N/A'}
              </SimpleTableCell>
              <SimpleTableCell className="text-xs">
                {new Date(cert.issued_at).toLocaleDateString()}
              </SimpleTableCell>
              <SimpleTableCell className="font-bold text-blue-600 text-xs">
                {cert.final_grade_percentage}%
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading && data.length === 0 && (
          <SimpleTableRow>
            <SimpleTableCell colSpan={4} className="text-center py-10 text-slate-400">
              No certificates issued.
            </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function AttendanceTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/40">
        <h3 className="font-bold text-slate-900">Attendance</h3>
      </div>
      <SimpleTable headers={['Student', 'Course', 'Date', 'Status']}>
        {isLoading &&
          [1, 2, 3].map((i) => (
            <SimpleTableRow key={i}>
              <SimpleTableCell colSpan={4}>
                <Skeleton className="h-10 w-full" />
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading &&
          data.map((record: any) => (
            <SimpleTableRow key={record._id}>
              <SimpleTableCell className="font-bold text-sm">
                {record.user_id?.name || 'N/A'}
              </SimpleTableCell>
              <SimpleTableCell className="text-xs">
                {record.course_id?.title || 'N/A'}
              </SimpleTableCell>
              <SimpleTableCell className="text-xs">
                {new Date(record.date).toLocaleDateString()}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge
                  className={cn(
                    'text-[10px] uppercase font-bold rounded-full',
                    record.status === 'present'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-red-50 text-red-600',
                  )}
                >
                  {record.status}
                </Badge>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        {!isLoading && data.length === 0 && (
          <SimpleTableRow>
            <SimpleTableCell colSpan={4} className="text-center py-10 text-slate-400">
              No attendance records.
            </SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function SettingsTab({ org, mutate }: { org: any, mutate: any }) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setLoading(action)
    try {
      const endpoint = action === 'reset-password' ? 'reset-admin-password' : action
      const method = action === 'delete' ? 'DELETE' : (action === 'reset-password' ? 'POST' : 'PATCH')
      
      const res = await fetch(`/api/platform/organizations/${org._id}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await res.json()
      if (result.success) {
        toast.success(result.message || `Action ${action} finalized.`)
        mutate()
      } else {
        toast.error(result.message || `Protocol failure for ${action}.`)
      }
    } catch (err) {
      toast.error("Network communication failure.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="p-8 border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60">
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
                variant={org.status === 'active' ? "destructive" : "outline"} 
                className="font-bold shadow-none h-10 px-6 min-w-[140px]"
                disabled={loading === 'suspend' || loading === 'activate'}
                onClick={() => handleAction(org.status === 'active' ? 'suspend' : 'activate')}
              >
                 {loading === 'suspend' || loading === 'activate' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 
                  (org.status === 'active' ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />)}
                 {org.status === 'active' ? "Suspend" : "Activate"}
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
                disabled={loading === 'reset-password'}
                onClick={() => handleAction('reset-password')}
              >
                 <RefreshCw className={cn("mr-2 h-4 w-4", loading === 'reset-password' && "animate-spin")} /> 
                 Send reset link
              </Button>
           </div>

           <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between mt-8">
              <div>
                 <div className="text-sm font-bold text-red-900">Delete organization</div>
                 <div className="text-xs text-red-700 mt-0.5">Soft‑delete this organization and disable all its users.</div>
              </div>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 font-bold shadow-none h-10 px-6"
                disabled={loading === 'delete'}
                onClick={() => { if(confirm('Are you sure you want to delete this organization?')) handleAction('delete') }}
              >
                 <Trash2 className={cn("mr-2 h-4 w-4", loading === 'delete' && "animate-spin")} /> 
                 Delete organization
              </Button>
           </div>
        </div>
      </Card>

      <Card className="p-8 border-slate-200 bg-white rounded-xl shadow-sm shadow-slate-100/60">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
           <Calendar className="h-5 w-5 text-blue-500" /> Infrastructure Metadata
        </h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Provisioned By</div>
            <div className="text-sm font-bold text-slate-900">{org.created_by?.name || "Root System"}</div>
            <div className="text-xs text-slate-500 mt-0.5">{org.created_by?.email}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Last Protocol Update</div>
            <div className="text-sm font-bold text-slate-900">{new Date(org.updated_at).toLocaleString()}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
