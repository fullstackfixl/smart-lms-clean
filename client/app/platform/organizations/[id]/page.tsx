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
  UserCheck
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
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

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
                <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center text-blue-600">
                  <Building2 className="h-10 w-10 stroke-[1.5]" />
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
               <Button variant="outline" className="rounded-xl px-6 h-12 border-slate-200 bg-white font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
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
           <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] border-none shadow-xl shadow-slate-200">
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
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Student Roster</h3>
         </div>
         <Badge className="bg-slate-100/80 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-none">
           {students.length} Enlisted
         </Badge>
      </div>
      <div className="overflow-x-auto">
        <SimpleTable headers={['Identity', 'Authentication', 'State']}>
          {isLoading ? (
            <SimpleTableRow>
              <SimpleTableCell colSpan={3} className="py-20 text-center">
                <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hydrating data nodes...</div>
              </SimpleTableCell>
            </SimpleTableRow>
          ) : students.length ? (
            students.map((s: any) => (
              <SimpleTableRow key={s._id || s.id} className="hover:bg-slate-50/60 transition-colors">
                <SimpleTableCell className="py-5 font-bold text-slate-900 group">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-black shadow-inner">
                      {(s.name || 'U').charAt(0)}
                    </div>
                    {s.name || 'Anonymous Identifier'}
                  </div>
                </SimpleTableCell>
                <SimpleTableCell className="py-5 text-slate-500 font-medium">{s.email || 'N/A'}</SimpleTableCell>
                <SimpleTableCell className="py-5">
                  <Badge className={cn('rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] shadow-none border', s.isActive === false ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100')}>
                    {s.isActive === false ? 'LOCKED' : 'ACTIVE'}
                  </Badge>
                </SimpleTableCell>
              </SimpleTableRow>
            ))
          ) : (
            <SimpleTableRow>
              <SimpleTableCell colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No node data discovered</SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
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
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Academic Staff</h3>
         </div>
      </div>
      <SimpleTable headers={['Core Member', 'Secure Email', 'Engagement']}>
        {isLoading ? (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-20 text-center">
               <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-500" />
            </SimpleTableCell>
          </SimpleTableRow>
        ) : instructors.length ? (
          instructors.map((i: any) => (
            <SimpleTableRow key={i._id || i.id} className="hover:bg-purple-50/20 transition-colors">
              <SimpleTableCell className="py-5 font-bold text-slate-900 flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-black">
                   {(i.name || 'I').charAt(0)}
                 </div>
                 {i.name}
              </SimpleTableCell>
              <SimpleTableCell className="py-5 text-slate-500 text-sm font-medium">{i.email}</SimpleTableCell>
              <SimpleTableCell className="py-5">
                <Badge className={cn('rounded-lg px-2.5 py-1 text-[9px] font-black uppercase border shadow-none', i.isActive === false ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100')}>
                  {i.isActive === false ? 'SUSPENDED' : 'OPERATIONAL'}
                </Badge>
              </SimpleTableCell>
            </SimpleTableRow>
          ))
        ) : (
          <SimpleTableRow>
            <SimpleTableCell colSpan={3} className="py-20 text-center text-slate-400 font-black text-[10px] tracking-[0.2em] uppercase">Staff pool empty</SimpleTableCell>
          </SimpleTableRow>
        )}
      </SimpleTable>
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
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
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
