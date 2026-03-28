"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
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
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  UserCheck,
  IdCard,
  Layers3,
  BadgeCheck
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
import { platformApi } from '../../../../lib/api'
import { getToken } from '../../../../lib/config'

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
  const { data: controlRes, isLoading: controlLoading, mutate: mutateControl } = useSWR<any>(`/api/platform/organizations/${orgId}/control`, platformJsonFetcher)

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
  const [contextLoading, setContextLoading] = useState(false)
  const orgLogo = org?.logo_url || org?.branding?.logo || org?.branding?.logo_url || null
  const orgInitials = (org?.name || 'ORG')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() || '')
    .join('') || 'ORG'

  useEffect(() => {
    // Suppress play interruption errors globally to avoid cluttering console
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
      const promise = originalPlay.apply(this, arguments as any);
      if (promise !== undefined) {
        promise.catch(error => {
          if (error.name !== 'AbortError') {
            console.error('Playback failed:', error);
          }
        });
      }
      return promise;
    };
  }, []);

  if (orgLoading) return (
    <div className="space-y-8 p-8 max-w-[1400px] mx-auto animate-pulse">
      <div className="flex items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="h-4 w-32 bg-slate-200 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-[500px] bg-slate-200 rounded-3xl" />
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
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'control', label: 'Control Plane', icon: Shield }
  ]

  const handleEnterContext = async () => {
    try {
      setContextLoading(true)
      const token = getToken()
      if (!token) {
        toast.error('Authentication token not found')
        return
      }

      const response = await platformApi.enterOrgContext(token, orgId)
      if (response.success && response.data) {
        const context = (response.data as any).context
        const url = context?.userFilterUrl || `/platform/users?organizationId=${orgId}`
        router.push(url)
        toast.success('Organization context loaded')
      } else {
        toast.error(response.error || 'Failed to enter organization context')
      }
    } finally {
      setContextLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="group text-slate-500 hover:text-blue-600 font-semibold p-0 h-auto gap-2"
              onClick={() => router.push('/platform/organizations')}
            >
              <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                <ChevronLeft className="h-4 w-4" />
              </div>
              Back to Fleet
            </Button>

            <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Platform Instance Active</span>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="flex items-center gap-6 relative z-10">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-blue-200">
                  <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center text-blue-600 overflow-hidden">
                    {orgLogo ? (
                      <img
                        src={orgLogo}
                        alt={`${org.name} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl tracking-tight">
                        {orgInitials}
                      </div>
                    )}
                  </div>
                </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {org.name}
                  </h1>
                  <Badge className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-none",
                    org.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {org.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    {org.type}
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold font-mono uppercase tracking-tighter">NODE_ID: {org.code || org._id.slice(-8)}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 relative z-10">
               <Button variant="outline" className="rounded-xl px-6 h-12 border-slate-200 bg-white font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm" onClick={handleEnterContext} disabled={contextLoading}>
                 <ExternalLink className="mr-2 h-4 w-4" /> Management Console
               </Button>
               <Button className="rounded-xl px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-200 active:scale-95">
                 Provision Features
               </Button>
            </div>
          </div>
        </motion.div>

        {/* Content Tabs Navigation */}
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-[280px] space-y-4">
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-3 rounded-3xl shadow-xl shadow-slate-200/50 sticky top-8">
              <div className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all duration-200 relative group",
                      activeTab === tab.id
                        ? "text-blue-600"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-50 rounded-2xl z-0"
                      />
                    )}
                    <tab.icon className={cn(
                      "h-4 w-4 stroke-[2.2] relative z-10 transition-transform group-hover:scale-110",
                      activeTab === tab.id ? "text-blue-600" : "text-slate-400"
                    )} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
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
                {activeTab === 'control' && <ControlTab orgId={orgId} control={controlRes?.data} isLoading={controlLoading} onSaved={() => { mutateControl(); mutateOrg(); }} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ org, stats }: { org: any, stats: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <FlatMetricCard title="Total Growth" value={stats?.totalEnrollments || 0} icon={GraduationCap} subtitle="Active enrollments" trend="+12%" />
        <FlatMetricCard title="Uptime" value={stats?.totalLiveClasses || 0} icon={Video} subtitle="Live class reliability" trend="100%" />
        <FlatMetricCard title="Verified" value={stats?.certificatesIssued || 0} icon={Award} subtitle="Certificates granted" trend="High" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 p-8 bg-white border-slate-200/60 rounded-[2rem] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Organization Integrity</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
            <ProfileItem label="Corporate Entity" value={org.name} icon={Building2} />
            <ProfileItem label="Deployment Type" value={org.type || 'Enterprise'} icon={Shield} />
            <ProfileItem label="Primary Node Email" value={org.email} icon={Mail} />
            <ProfileItem label="Support Channel" value={org.phone || 'Not configured'} icon={Phone} />
            <ProfileItem label="Geographic Node" value={`${org.address?.city || 'Local'}${org.address?.city && org.address?.country ? ', ' : ''}${org.address?.country || 'Server'}`} icon={MapPin} />
            <ProfileItem label="External Interface" value={org.website || 'Internal Only'} icon={Globe} link={org.website} />
            <ProfileItem label="Provisioned On" value={org.created_at ? new Date(org.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—'} icon={Calendar} />
            <ProfileItem label="Operations Status" value={org.status} icon={Activity} />
          </div>

          <div className="mt-12 pt-10 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Activity className="h-4 w-4" />
              </div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Manifesto</h4>
            </div>
            <p className="text-slate-600 text-[14px] leading-relaxed max-w-2xl font-medium">
              {org.description || 'No specialized manifesto provided for this organization yet. Standard platform protocols applied.'}
            </p>
          </div>
        </Card>

        <div className="space-y-6">
           <Card className="p-8 bg-gradient-to-br from-blue-50 to-white text-slate-900 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100">
             <div className="flex items-center justify-between mb-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Level Agreement</h4>
                <div className="px-2 py-1 rounded-md bg-white/10 text-[10px] font-bold">PREMIUM</div>
             </div>
             <div className="space-y-8">
               <div className="flex items-end gap-3">
                 <div className="text-5xl font-black">99.9</div>
                 <div className="text-xl font-bold text-slate-400 pb-1.5">%</div>
               </div>
               <div className="text-xs text-slate-400 leading-relaxed font-semibold">
                 Guaranteeing high-performance infrastructure with near-zero latency multi-tenant isolation.
               </div>
               <Button className="w-full h-12 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all">
                 View Tier Details
               </Button>
             </div>
           </Card>

           <Card className="p-8 bg-white border-slate-200/60 rounded-[2rem] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest leading-none">Activity Velocity</h4>
              </div>
              <div className="h-[120px] w-full bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 italic">Analytical engine initializing...</div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  )
}

function AttendanceTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
             <FileCheck className="h-5 w-5" />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-900">Attendance Intelligence</h3>
             <p className="text-xs text-slate-500 font-medium">Monitoring session integrity and student participation</p>
           </div>
        </div>
        {!isLoading && (
          <Badge className="bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-[11px] font-black tracking-widest uppercase border border-blue-100 shadow-none">
            {data.length} Records
          </Badge>
        )}
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Session Details</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Instructor</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Participation</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center">
                   <div className="flex flex-col items-center gap-4">
                     <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                     <div className="text-sm font-bold text-slate-400">Compiling attendance logs...</div>
                   </div>
                </td>
              </tr>
            ) : data.length ? (
              data.map((record: any) => (
                <tr key={record._id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="text-[14px] font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {record.course_id?.title || record.session_title || 'General Session'}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.session_date).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-[10px] font-black uppercase tracking-tighter shadow-sm border border-orange-200">
                        {(record.instructor_id?.name || 'S').charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-bold text-slate-800">{record.instructor_id?.name || 'System Admin'}</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-tight">{record.instructor_id?.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2 w-32">
                       <div className="flex items-center justify-between text-[10px] font-black tracking-widest mb-1 uppercase">
                         <span className={cn(
                           record.attendance_percentage > 80 ? "text-green-600" : record.attendance_percentage < 50 ? "text-red-500" : "text-orange-500"
                         )}>{record.attendance_percentage || 0}% Rate</span>
                         <span className="text-slate-400">{record.attendance_records?.length || 0} Pax</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                         <div 
                           className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            record.attendance_percentage > 80 ? "bg-green-500" : record.attendance_percentage < 50 ? "bg-red-500" : "bg-orange-400"
                           )}
                           style={{ width: `${record.attendance_percentage || 0}%` }}
                         />
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 rounded-lg px-2 py-1 text-[9px] font-black uppercase shadow-none">
                        AUTO
                      </Badge>
                      <Badge className="bg-green-50 text-green-700 border-green-200 rounded-lg px-2 py-1 text-[9px] font-black uppercase shadow-none ring-1 ring-green-500/10">
                        SYNCHRONIZED
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-40">
                      <div className="p-4 rounded-full bg-slate-100 text-slate-400">
                         <Search className="h-8 w-8" />
                      </div>
                      <div className="text-sm font-bold text-slate-500">No attendance records found for this frequency.</div>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function StudentsTab({ students, isLoading }: { students: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Student Roster</h3>
              <p className="text-xs text-slate-500 font-medium">Profile, attendance, marks, batch, and program visibility</p>
            </div>
         </div>
         <Badge className="bg-slate-100/80 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-none">
           {students.length} Enlisted
         </Badge>
      </div>
      <div className="p-6 lg:p-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/50 p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-200" />
                  <div className="space-y-3 flex-1">
                    <div className="h-5 w-40 rounded bg-slate-200" />
                    <div className="h-4 w-56 rounded bg-slate-200" />
                    <div className="h-4 w-28 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-2xl bg-slate-200" />
                  <div className="h-16 rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : students.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {students.map((student: any) => {
              const profile = student.profile || {}
              const attendance = student.academic?.attendance || null
              const grades = student.academic?.gradeSummary || null
              const submissions = student.academic?.submissions || null
              const programName = profile.program?.name || profile.program?.code || 'No program'
              const batchName = profile.batch?.name || profile.batch?.code || 'No batch'
              const departmentName = profile.department?.name || 'No department'
              const avatar = profile.photoUrl || profile.pic_url || student.profilePicture || null
              const initials = (student.name || 'S').slice(0, 1).toUpperCase()

              return (
                <div key={student._id || student.id} className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all">
                  <div className="flex items-start gap-4">
                    <UserAvatar name={student.name} src={avatar} initials={initials} tone="student" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-black text-slate-950 truncate">{student.name || 'Anonymous Student'}</h4>
                        <Badge className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] border shadow-none', student.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100')}>
                          {student.status || (student.isActive === false ? 'inactive' : 'active')}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-500 break-all">{student.email || 'No email available'}</div>
                      <div className="mt-2 text-sm text-slate-600 leading-6">{profile.bio || 'No bio provided.'}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Student ID" value={profile.rollNumber || student.student_code || student._id} icon={IdCard} />
                    <MiniMetric label="Program" value={programName} icon={Layers3} />
                    <MiniMetric label="Batch" value={batchName} icon={BookOpen} />
                    <MiniMetric label="Department" value={departmentName} icon={BadgeCheck} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <StatTile
                      label="Attendance"
                      value={`${attendance?.attendance_percentage ?? 0}%`}
                      detail={`${attendance?.present || 0} present / ${attendance?.total_sessions || 0} sessions`}
                      tone="blue"
                    />
                    <StatTile
                      label="GPA"
                      value={`${grades?.gpa ?? 0}`}
                      detail={`${grades?.total_courses || 0} graded courses`}
                      tone="indigo"
                    />
                    <StatTile
                      label="Submissions"
                      value={`${submissions?.graded || 0}/${submissions?.total || 0}`}
                      detail="graded / total"
                      tone="emerald"
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <DetailChip label="Phone" value={profile.phone || student.profile?.phone || 'Not available'} />
                    <DetailChip label="Bio" value={profile.bio || 'No bio recorded'} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 font-black text-[10px] uppercase tracking-[0.25em]">
            No student profile data available
          </div>
        )}
      </div>
    </Card>
  )
}

function InstructorsTab({ instructors, isLoading }: { instructors: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Academic Staff</h3>
              <p className="text-xs text-slate-500 font-medium">Subject ownership, course creation, and instructor operations</p>
            </div>
         </div>
      </div>
      <div className="p-6 lg:p-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/50 p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-200" />
                  <div className="space-y-3 flex-1">
                    <div className="h-5 w-40 rounded bg-slate-200" />
                    <div className="h-4 w-56 rounded bg-slate-200" />
                    <div className="h-4 w-28 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-2xl bg-slate-200" />
                  <div className="h-16 rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : instructors.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {instructors.map((instructor: any) => {
              const profile = instructor.profile || {}
              const avatar = profile.photoUrl || profile.pic_url || instructor.profilePicture || null
              const initials = (instructor.name || 'I').slice(0, 1).toUpperCase()
              const subjects = instructor.academic?.subjects || []
              const courses = instructor.academic?.courses || []

              return (
                <div key={instructor._id || instructor.id} className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-purple-100 transition-all">
                  <div className="flex items-start gap-4">
                    <UserAvatar name={instructor.name} src={avatar} initials={initials} tone="instructor" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-black text-slate-950 truncate">{instructor.name || 'Anonymous Instructor'}</h4>
                        <Badge className={cn('rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] border shadow-none', instructor.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100')}>
                          {instructor.status || (instructor.isActive === false ? 'inactive' : 'active')}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-500 break-all">{instructor.email || 'No email available'}</div>
                      <div className="mt-2 text-sm text-slate-600 leading-6">{profile.bio || profile.expertise || 'No staff bio provided.'}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <MiniMetric label="Instructor ID" value={profile.rollNumber || instructor.employeeCode || instructor._id} icon={IdCard} />
                    <MiniMetric label="Department" value={profile.department?.name || profile.department?.code || 'No department'} icon={BadgeCheck} />
                    <MiniMetric label="Subjects" value={String(subjects.length)} icon={BookOpen} />
                    <MiniMetric label="Courses" value={String(courses.length)} icon={Layers3} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <StatTile
                      label="Sessions"
                      value={`${instructor.academic?.taughtSessions || 0}`}
                      detail="attendance sessions taught"
                      tone="purple"
                    />
                    <StatTile
                      label="Live Classes"
                      value={`${instructor.academic?.liveClasses || 0}`}
                      detail="active class rooms"
                      tone="blue"
                    />
                    <StatTile
                      label="Students"
                      value={`${instructor.academic?.totalStudents || 0}`}
                      detail="connected learners"
                      tone="emerald"
                    />
                  </div>

                  <div className="mt-5 space-y-3">
                    <DetailChip label="Profile" value={profile.bio || 'No bio recorded'} />
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subjects taught</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {subjects.length ? subjects.slice(0, 4).map((subject: any) => (
                          <Badge key={subject._id || subject.id} className="rounded-full bg-white text-slate-700 border border-slate-200 shadow-none">
                            {subject.name || subject.code || 'Subject'}
                          </Badge>
                        )) : (
                          <span className="text-sm font-medium text-slate-400">No subject assignments</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Courses created</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {courses.length ? courses.slice(0, 4).map((course: any) => (
                          <Badge key={course._id || course.id} className="rounded-full bg-white text-slate-700 border border-slate-200 shadow-none">
                            {course.title || course.name || 'Course'}
                          </Badge>
                        )) : (
                          <span className="text-sm font-medium text-slate-400">No courses created</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 font-black text-[10px] tracking-[0.25em] uppercase">
            Staff pool empty
          </div>
        )}
      </div>
    </Card>
  )
}

function CoursesTab({ courses, isLoading }: { courses: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Knowledge Assets</h3>
         </div>
      </div>
      <SimpleTable headers={['Program Title', 'Visibility State', 'Node Volume']}>
        {isLoading ? (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-20 text-center">Loading Module Registry...</SimpleTableCell>
          </SimpleTableRow>
        ) : courses.length ? (
          courses.map((c: any) => (
            <SimpleTableRow key={c._id || c.id} className="hover:bg-slate-50/80 transition-all">
              <SimpleTableCell className="py-6 font-bold text-slate-900">
                <div className="flex flex-col">
                   <span>{c.title || c.name}</span>
                   <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">CODE: {c.code || 'PRM-001'}</span>
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="py-6">
                <Badge className={cn('rounded-lg px-2.5 py-1 text-[9px] font-black uppercase border shadow-none', (c.status || c.state) === 'published' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100')}>
                  {c.status || c.state || 'DRAFT_MODE'}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="py-6 font-black text-slate-900 text-lg group">
                {c.enrollmentCount || 0}
                <span className="text-[10px] text-slate-400 ml-1 font-bold group-hover:text-blue-500 transition-colors uppercase tracking-tight">Enrolled</span>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">Registry is currently void</SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
    </Card>
  )
}

function LiveClassesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Live Network Sessions</h3>
         </div>
      </div>
      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center p-12"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin" /></div>
        ) : data.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((x: any) => (
              <div key={x._id || x.id} className="flex flex-col justify-between border border-slate-100 rounded-2xl p-6 bg-slate-50/40 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-white transition-all duration-300 group">
                <div className="mb-6">
                  <Badge className="mb-4 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest border-none px-3 py-1 shadow-none">
                    {x.type || 'Standard Link'}
                  </Badge>
                  <div className="text-[16px] font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{x.title || x.topic || 'Secure Protocol Session'}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-wide">
                    <Clock className="h-3 w-3" />
                    {x.scheduledAt ? new Date(x.scheduledAt).toLocaleString() : 'Scheduling...'}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{x.instructor_id?.name || 'Assigned Staff'}</span>
                  </div>
                  <Badge className="bg-white text-slate-600 rounded-lg px-2 py-1 text-[9px] font-black border border-slate-200 uppercase shadow-none ring-1 ring-slate-100">
                    {x.status || 'READY'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center"><p className="text-slate-400 font-bold uppercase tracking-widest italic text-xs">No active network sessions detected</p></div>
        )}
      </div>
    </Card>
  )
}

function QuizzesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Assessment Kernels</h3>
         </div>
      </div>
      <div className="p-8">
        {isLoading ? (
          <div>Hydrating assessments...</div>
        ) : data.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((q: any) => (
              <div key={q._id || q.id} className="flex items-center justify-between border border-slate-100 rounded-2xl p-5 bg-slate-50/50 hover:bg-white transition-all shadow-sm hover:shadow-lg hover:border-white">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-amber-500 shadow-sm">
                    {q.questionsCount || 0}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{q.title || 'Security Protocol Quiz'}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Complexity: Standard</div>
                  </div>
                </div>
                <Badge className="bg-slate-100 text-slate-600 border-none rounded-lg px-3 py-1.5 text-[9px] font-black uppercase shadow-none">
                  {q.status || 'ACTIVE'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center opacity-40 italic font-bold uppercase text-xs tracking-widest">No assessment logic detected</div>
        )}
      </div>
    </Card>
  )
}

function CertificatesTab({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Certification Ledger</h3>
      </div>
      <div className="p-8">
        {isLoading ? (
          <div>Reading ledger...</div>
        ) : data.length ? (
          <div className="space-y-4">
            {data.map((c: any) => (
              <div key={c._id || c.id} className="flex items-center justify-between border border-slate-100 rounded-2xl p-6 bg-slate-50/30 hover:bg-white hover:shadow-xl transition-all">
                <div className="flex items-center gap-5">
                   <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <Award className="h-6 w-6" />
                   </div>
                   <div>
                     <div className="text-[16px] font-black text-slate-900 mb-0.5 tracking-tight">{c.title || c.name || 'Credential of Excellence'}</div>
                     <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : 'Issued Today'}</div>
                   </div>
                </div>
                <Button variant="outline" size="sm" className="h-10 px-6 rounded-xl border-slate-200 bg-white font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Verify & Download</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic text-[10px]">No credentials issued in current epoch</div>
        )}
      </div>
    </Card>
  )
}

function ActivityTab({ activity, isLoading }: { activity: any[]; isLoading: boolean }) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 shadow-lg shadow-blue-100">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Live Intelligence Stream</h3>
         </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
           <thead>
              <tr className="bg-slate-50/50">
                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-center w-20">Type</th>
                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Origin Actor</th>
                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Event Signature</th>
                 <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Timestamp</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={4} className="py-20 text-center"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" /></td></tr>
            ) : activity.length ? (
              activity.map((a: any) => (
                <tr key={a._id || a.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-8 py-6">
                     <div className="flex justify-center">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          a.action?.includes('delete') ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        )} />
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-900 text-[10px] font-black shadow-sm">
                        {(a.actor?.name || a.user?.name || 'S').charAt(0)}
                      </div>
                      <div className="text-sm font-bold text-slate-900">{a.actor?.name || a.user?.name || 'CORE SYSTEM'}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                      {a.action || a.event || 'NODE_PULSE'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-bold font-mono text-[10px] text-slate-400 uppercase tracking-tighter">
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : 'UNDEFINED_EPOCH'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">No telemetry detected</td>
              </tr>
            )}
           </tbody>
        </table>
      </div>
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
        toast.success(result.message || `Protocol update success.`)
        mutate()
      } else {
        toast.error(result.message || `Protocol violation detected.`)
      }
    } catch {
      toast.error('Network signal lost')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="bg-white border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden p-10">
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
           <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 shadow-sm shadow-orange-100">
             <Shield className="h-6 w-6" />
           </div>
           <div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Admin Override</h3>
             <p className="text-sm font-medium text-slate-500">Root level commands for organization lifecycle management</p>
           </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
            <div className="space-y-1">
              <div className="text-[15px] font-black text-slate-900 uppercase tracking-tight">Cycle State Override</div>
              <div className="text-sm font-bold text-slate-400 leading-none">Instant suspension/activation of all node operations.</div>
            </div>
            <Button
              variant={org.status === 'active' ? 'destructive' : 'outline'}
              className={cn(
                "font-black tracking-widest uppercase text-[10px] shadow-none h-11 px-8 rounded-xl transition-all active:scale-95",
                org.status === 'active' ? "bg-red-600 hover:bg-red-700" : "bg-white border-slate-200"
              )}
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
              {org.status === 'active' ? 'SUSPEND_NOW' : 'INVOKE_NODE'}
            </Button>
          </div>

          <div className="p-8 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
            <div className="space-y-1">
              <div className="text-[15px] font-black text-slate-900 uppercase tracking-tight">Security Handshake Reset</div>
              <div className="text-sm font-bold text-slate-400 leading-none">Force regeneration of admin credentials.</div>
            </div>
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50 font-black tracking-widest uppercase text-[10px] shadow-none h-11 px-8 rounded-xl transition-all active:scale-95"
              disabled={actionLoading === 'reset-password'}
              onClick={() => handleAction('reset-password')}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', actionLoading === 'reset-password' && 'animate-spin')} />
              Dispatch Token
            </Button>
          </div>

          <div className="mt-12 p-8 rounded-[1.5rem] bg-red-50/30 border border-red-100 flex items-center justify-between group hover:bg-red-600 hover:shadow-2xl hover:shadow-red-200 transition-all duration-500">
            <div className="space-y-1">
              <div className="text-[15px] font-black text-red-900 group-hover:text-white uppercase tracking-tight transition-colors">Terminus Sequence</div>
              <div className="text-sm font-bold text-red-400 group-hover:text-red-100 leading-none transition-colors">Irreversible decommissioning of the organization.</div>
            </div>
            <Button
              variant="destructive"
              className="bg-red-600 border border-red-400 hover:bg-red-700 font-black tracking-widest uppercase text-[10px] shadow-none h-11 px-8 rounded-xl transition-all active:scale-95 group-hover:bg-white group-hover:text-red-600 group-hover:border-white"
              disabled={actionLoading === 'delete'}
              onClick={() => {
                if (confirm('Initiate destructive terminus sequence?')) handleAction('delete')
              }}
            >
              <Trash2 className={cn('mr-2 h-4 w-4', actionLoading === 'delete' && 'animate-spin')} />
              DECOMMISSION
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-10 bg-white border-slate-200/60 rounded-[2rem] shadow-sm">
        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
          <Calendar className="h-5 w-5 text-blue-500" /> Infrastructure Metadata
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original Architect</div>
            <div className="text-md font-black text-slate-900">{org.created_by?.name || 'ROOT_OVERSEER'}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-bold">{org.created_by?.email || 'SYSTEM_DEFAULT'}</div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Last Synchronisation</div>
            <div className="text-md font-black text-slate-900 font-mono text-[14px] uppercase tracking-tighter">
              {org.updated_at ? new Date(org.updated_at).toLocaleString() : 'INITIAL_BUILD'}
            </div>
            <div className="text-[10px] text-green-600 mt-2 font-black uppercase tracking-widest flex items-center gap-1.5 ">
              <CheckCircle2 className="h-3 w-3" /> Integrity Verified
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function createControlDraft(control: any) {
  return {
    permissions: {
      canCreateCourses: control?.permissions?.canCreateCourses ?? true,
      canCreateInstructors: control?.permissions?.canCreateInstructors ?? true,
      canAccessMarketplace: control?.permissions?.canAccessMarketplace ?? true,
      canViewFinancials: control?.permissions?.canViewFinancials ?? true,
      canManageChat: control?.permissions?.canManageChat ?? true,
      canManageAttendance: control?.permissions?.canManageAttendance ?? true,
      canEnterOrgContext: control?.permissions?.canEnterOrgContext ?? true
    },
    limits: {
      maxUsers: control?.limits?.maxUsers ?? null,
      maxStudents: control?.limits?.maxStudents ?? null,
      maxInstructors: control?.limits?.maxInstructors ?? null,
      maxCourses: control?.limits?.maxCourses ?? null,
      storageMb: control?.limits?.storageMb ?? null
    },
    features: {
      liveClasses: control?.features?.liveClasses ?? true,
      chat: control?.features?.chat ?? true,
      aiAssistant: control?.features?.aiAssistant ?? false,
      marketplace: control?.features?.marketplace ?? true
    },
    finance: {
      canViewFinancials: control?.finance?.canViewFinancials ?? true,
      canEditFees: control?.finance?.canEditFees ?? false,
      canViewInstructorSalary: control?.finance?.canViewInstructorSalary ?? false,
      revenueSharePercent: control?.finance?.revenueSharePercent ?? 15
    },
    marketplace: {
      enabled: control?.marketplace?.enabled ?? true,
      approvalRequired: control?.marketplace?.approvalRequired ?? true,
      revenueSharePercent: control?.marketplace?.revenueSharePercent ?? 15
    },
    ghostMode: {
      readOnly: control?.ghostMode?.readOnly ?? true,
      override: control?.ghostMode?.override ?? true
    }
  }
}

function ControlTab({ orgId, control, isLoading, onSaved }: { orgId: string; control: any; isLoading: boolean; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(() => createControlDraft(control))

  useEffect(() => {
    setDraft(createControlDraft(control))
  }, [control])

  const updateToggle = (section: keyof typeof draft, key: string, value: boolean) => {
    setDraft((current: any) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value
      }
    }))
  }

  const updateNumber = (section: keyof typeof draft, key: string, value: string) => {
    setDraft((current: any) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value === '' ? null : Number(value)
      }
    }))
  }

  const handleSave = async () => {
    const token = getToken()
    if (!token) {
      toast.error('Authentication token not found')
      return
    }

    setSaving(true)
    try {
      const payload = {
        permissions: draft.permissions,
        limits: draft.limits,
        features: draft.features,
        finance: draft.finance,
        marketplace: draft.marketplace,
        ghostMode: draft.ghostMode
      }
      const response = await platformApi.updateOrgControlPanel(token, orgId, payload)
      if (response.success) {
        toast.success('Organization control updated')
        onSaved()
      } else {
        toast.error(response.error || response.message || 'Failed to update organization control')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const booleanRows = [
    { section: 'permissions', key: 'canCreateCourses', label: 'Can create courses' },
    { section: 'permissions', key: 'canCreateInstructors', label: 'Can create instructors' },
    { section: 'permissions', key: 'canAccessMarketplace', label: 'Can access marketplace' },
    { section: 'permissions', key: 'canViewFinancials', label: 'Can view financials' },
    { section: 'permissions', key: 'canManageChat', label: 'Can manage chat' },
    { section: 'permissions', key: 'canManageAttendance', label: 'Can manage attendance' },
    { section: 'permissions', key: 'canEnterOrgContext', label: 'Can enter org context' }
  ] as const

  const featureRows = [
    { section: 'features', key: 'liveClasses', label: 'Live classes' },
    { section: 'features', key: 'chat', label: 'Chat' },
    { section: 'features', key: 'aiAssistant', label: 'AI assistant' },
    { section: 'features', key: 'marketplace', label: 'Marketplace' }
  ] as const

  const financeRows = [
    { section: 'finance', key: 'canViewFinancials', label: 'Org financial visibility' },
    { section: 'finance', key: 'canEditFees', label: 'Edit fee records' },
    { section: 'finance', key: 'canViewInstructorSalary', label: 'View instructor salary' }
  ] as const

  const limitRows = [
    { key: 'maxUsers', label: 'Max users' },
    { key: 'maxStudents', label: 'Max students' },
    { key: 'maxInstructors', label: 'Max instructors' },
    { key: 'maxCourses', label: 'Max courses' },
    { key: 'storageMb', label: 'Storage (MB)' }
  ] as const

  if (isLoading) {
    return (
      <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-8 w-48 bg-slate-100" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 bg-slate-100" />
          <Skeleton className="h-64 bg-slate-100" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Tenant Control Panel</h3>
            <p className="mt-1 text-sm text-slate-500">
              Persistent permission envelope for this organization. Changes here directly govern what the tenant can do.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700">
            {saving ? 'Saving...' : 'Save Controls'}
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <FlatMetricCard title="Courses Allowed" value={draft.permissions.canCreateCourses ? 'Yes' : 'No'} icon={BookOpen} subtitle="Write access" />
          <FlatMetricCard title="Marketplace" value={draft.permissions.canAccessMarketplace ? 'Enabled' : 'Disabled'} icon={Globe} subtitle="Cross-tenant commerce" />
          <FlatMetricCard title="Financials" value={draft.permissions.canViewFinancials ? 'Visible' : 'Hidden'} icon={Activity} subtitle="Fee and revenue visibility" />
          <FlatMetricCard title="Ghost Mode" value={draft.ghostMode.readOnly ? 'Read only' : 'Override'} icon={Shield} subtitle="Platform view mode" />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Permission Layer</h4>
          <div className="mt-6 space-y-4">
            {booleanRows.map((row) => (
              <label key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className="text-sm font-bold text-slate-800">{row.label}</span>
                <input
                  type="checkbox"
                  checked={(draft as any)[row.section][row.key]}
                  onChange={(e) => updateToggle(row.section as any, row.key, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Feature and Finance</h4>
          <div className="mt-6 space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Features</div>
              {featureRows.map((row) => (
                <label key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <span className="text-sm font-bold text-slate-800">{row.label}</span>
                  <input
                    type="checkbox"
                    checked={(draft as any)[row.section][row.key]}
                    onChange={(e) => updateToggle(row.section as any, row.key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                </label>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Finance</div>
              {financeRows.map((row) => (
                <label key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <span className="text-sm font-bold text-slate-800">{row.label}</span>
                  <input
                    type="checkbox"
                    checked={(draft as any)[row.section][row.key]}
                    onChange={(e) => updateToggle(row.section as any, row.key, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                </label>
              ))}
              <label className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className="text-sm font-bold text-slate-800">Revenue share percent</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.finance.revenueSharePercent}
                  onChange={(e) => updateNumber('finance', 'revenueSharePercent', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-white"
                />
              </label>
              <label className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <span className="text-sm font-bold text-slate-800">Marketplace revenue share percent</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.marketplace.revenueSharePercent}
                  onChange={(e) => updateNumber('marketplace', 'revenueSharePercent', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-white"
                />
              </label>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Tenant Limits</h4>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {limitRows.map((row) => (
            <label key={row.key} className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <span className="text-sm font-bold text-slate-800">{row.label}</span>
                <Input
                  type="number"
                  min={0}
                  value={(draft.limits as any)[row.key] ?? ''}
                  onChange={(e) => updateNumber('limits', row.key, e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-white"
                  placeholder="Unlimited"
                />
            </label>
          ))}
        </div>
      </Card>

      <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Marketplace Governance</h4>
            <p className="mt-1 text-sm text-slate-500">Controls the commercial layer for course publication and cross-org adoption.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {control?.marketplace?.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">Marketplace enabled</span>
            <input
              type="checkbox"
              checked={draft.marketplace.enabled}
              onChange={(e) => updateToggle('marketplace', 'enabled', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">Approval required</span>
            <input
              type="checkbox"
              checked={draft.marketplace.approvalRequired}
              onChange={(e) => updateToggle('marketplace', 'approvalRequired', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">AI assistant</span>
            <input
              type="checkbox"
              checked={draft.features.aiAssistant}
              onChange={(e) => updateToggle('features', 'aiAssistant', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>
        </div>
      </Card>

      <Card className="rounded-[2rem] border-slate-200 bg-white p-8 shadow-sm">
        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Ghost Mode</h4>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">Read-only observation</span>
            <input
              type="checkbox"
              checked={draft.ghostMode.readOnly}
              onChange={(e) => updateToggle('ghostMode', 'readOnly', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">Override access</span>
            <input
              type="checkbox"
              checked={draft.ghostMode.override}
              onChange={(e) => updateToggle('ghostMode', 'override', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          </label>
        </div>
      </Card>
    </div>
  )
}

function ProfileItem({ label, value, icon: Icon, link }: { label: string; value: string; icon: any; link?: string }) {
  const content = link ? (
    <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 font-black hover:underline group-hover:text-blue-700 transition-colors">
      {value}
    </a>
  ) : (
    <div className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">{value}</div>
  )

  return (
    <div className="flex items-start gap-5 group">
      <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 shadow-sm group-hover:border-blue-200 group-hover:shadow-md transition-all group-hover:bg-blue-50 group-hover:text-blue-600">
        <Icon className="h-5 w-5 stroke-[1.5]" />
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</div>
        <div className="mt-0">{content}</div>
      </div>
    </div>
  )
}

function UserAvatar({ name, src, initials, tone }: { name?: string; src?: string | null; initials: string; tone: 'student' | 'instructor' }) {
  const ringClass = tone === 'student'
    ? 'from-blue-500 to-cyan-500 shadow-blue-100'
    : 'from-purple-500 to-pink-500 shadow-purple-100'

  return (
    <div className={`h-16 w-16 rounded-2xl p-0.5 bg-gradient-to-br ${ringClass} shadow-lg flex-shrink-0`}>
      <div className="h-full w-full rounded-[14px] bg-white overflow-hidden flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={name ? `${name} avatar` : 'User avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={cn(
            "h-full w-full flex items-center justify-center text-xl font-black uppercase",
            tone === 'student' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
          )}>
            {initials}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniMetric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        {label}
      </div>
      <div className="mt-2 text-sm font-black text-slate-950 break-words">{value || 'N/A'}</div>
    </div>
  )
}

function StatTile({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'blue' | 'indigo' | 'emerald' | 'purple' }) {
  const styles = {
    blue: 'from-blue-50 to-cyan-50 border-blue-100 text-blue-700',
    indigo: 'from-indigo-50 to-violet-50 border-indigo-100 text-indigo-700',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-100 text-emerald-700',
    purple: 'from-purple-50 to-fuchsia-50 border-purple-100 text-purple-700'
  }

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-br p-4", styles[tone])}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-[11px] font-medium text-slate-500">{detail}</div>
    </div>
  )
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-700 leading-6">{value}</div>
    </div>
  )
}
