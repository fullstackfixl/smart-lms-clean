"use client"
 
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, 
  Users, 
  Video, 
  Calendar, 
  TrendingUp, 
  Clock,
  FileText, 
  Award, 
  Loader2, 
  Plus, 
  Eye,
  Activity,
  ChevronRight,
  Zap,
  Layout,
  Layers,
  Search,
  ArrowUpRight,
  Bell,
  Star,
  Target,
  ShieldCheck,
  MousePointer2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { toast } from "sonner"
import { API_URL, getToken } from '../../../lib/config'
import { useAuth } from '../../../lib/auth-context'
 
interface DashboardData {
  totalCourses: number
  totalStudents: number
  totalLectures: number
  upcomingClasses: any[]
  recentSubmissions: any[]
  completionRate: number
  completionStats: {
    total: number
    completed: number
  }
  attendanceStats?: {
    overallPercentage: number
    atRiskStudents: number
  }
  mySubjects?: any[]
}
 
export default function InstructorDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
 
  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])
 
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) {
        toast.error('Session expired')
        router.push('/login')
        return
      }
 
      const response = await fetch(
        `${API_URL}/instructor/dashboard/overview`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      )
 
      const result = await response.json()
 
      if (result.success) {
        let dashboardData = result.data;
 
        if (user?.organizationType === 'COLLEGE') {
          const subRes = await fetch(`${API_URL}/instructor/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const subData = await subRes.json();
          if (subData.success) {
            dashboardData.mySubjects = subData.data;
          }
        }
 
        setData(dashboardData)
      } else {
        toast.error(result.message || 'Synchronization failure')
      }
    } catch (error) {
      console.error('Peak Dashboard error:', error)
      toast.error('Intelligence stream link severed')
    } finally {
      setLoading(false)
    }
  }
 
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-indigo-600 fill-indigo-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
           <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em]">Calibrating Executive Console</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Establishing secure link...</p>
        </div>
      </div>
    )
  }
 
  if (!data || !mounted) return null;
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Executive Header Layer ───────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000"></div>
        <div className="relative overflow-hidden rounded-[3.5rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
          {/* Ambient Background Elements */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[40rem] h-[40rem] bg-indigo-50/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-blue-50/40 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-[0.25em] border border-indigo-100/50">
                <ShieldCheck className="w-4 h-4 fill-indigo-700/10" />
                Verified Educator Console
              </div>
              
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Peak Performance, <br />
                  <span className="text-indigo-600 inline-flex items-center gap-4">
                    {user?.name?.split(' ')[0] || "Educator"}
                    <motion.div 
                      animate={{ y: [0, -4, 0] }} 
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Zap className="w-12 h-12 fill-indigo-600" />
                    </motion.div>
                  </span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Your pedagogical influence is expanding. Navigate through real-time scholar analytics, curriculum mastery trends, and upcoming broadcast channels.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button 
                  onClick={() => router.push('/instructor/courses/new')}
                  className="h-20 px-12 bg-slate-900 text-white rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] group"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" strokeWidth={3} />
                  PROVISION COURSE
                </button>
                <button className="h-20 w-20 flex items-center justify-center rounded-[2.2rem] border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all">
                  <Bell className="w-7 h-7" />
                </button>
              </div>
            </div>
 
            {/* Quick Context Grid */}
            <div className="hidden xl:grid grid-cols-2 gap-6 w-full max-w-md">
                <ContextMiniCard label="Active Students" value={data.totalStudents} icon={<Users color="#4F46E5" />} />
                <ContextMiniCard label="Global Rank" value="#12" icon={<Star color="#F59E0B" />} />
                <ContextMiniCard label="Engagement" value="94%" icon={<Activity color="#10B981" />} />
                <ContextMiniCard label="Tasks Pending" value={data.recentSubmissions.length} icon={<FileText color="#EF4444" />} />
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Global Intelligence Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <PeakMetric 
          label="Curriculum Volume" 
          value={data.totalCourses} 
          icon={<BookOpen className="w-6 h-6" />} 
          color="indigo"
          trend="+2 New"
          delay={0.1}
        />
        <PeakMetric 
          label="Scholar Registry" 
          value={data.totalStudents} 
          icon={<Users className="w-6 h-6" />} 
          color="emerald"
          trend="+12% Gain"
          delay={0.2}
        />
        <PeakMetric 
          label="Knowledge Assets" 
          value={data.totalLectures} 
          icon={<Video className="w-6 h-6" />} 
          color="blue"
          trend="84h Stream"
          delay={0.3}
        />
        <PeakMetric 
          label="Mastery Velocity" 
          value={`${Math.round(data.completionRate)}%`} 
          icon={<Target className="w-6 h-6" />} 
          color="amber"
          trend="Elite Tier"
          delay={0.4}
        />
      </div>
 
      {/* ─── Predictive Analytics Layer ───────────────────────────────── */}
      {user?.organizationType === 'COLLEGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 relative overflow-hidden rounded-[3.5rem] bg-indigo-600 p-16 text-white group cursor-default shadow-[0_40px_80px_-20px_rgba(79,70,229,0.3)]">
              <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-white/10 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-12">
                 <div className="flex items-center justify-between">
                    <div className="space-y-4">
                       <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/60">Predictive Modeling</p>
                       <h2 className="text-4xl font-black tracking-tight leading-tight italic">Scholarly Retention <br />& Participation</h2>
                    </div>
                    <button onClick={() => router.push('/instructor/attendance')} className="h-14 px-8 bg-white/10 hover:bg-white text-white hover:text-indigo-600 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all border border-white/20 hover:border-white">Deep Analyze</button>
                 </div>
                 <div className="flex items-center gap-20">
                    <div className="space-y-1">
                       <p className="text-7xl font-black tracking-tighter">{data.attendanceStats?.overallPercentage || 0}%</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">System Participation</p>
                    </div>
                    <div className="h-20 w-[1px] bg-white/10" />
                    <div className="space-y-1">
                       <p className="text-7xl font-black tracking-tighter text-rose-300">{data.attendanceStats?.atRiskStudents || 0}</p>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Risk Intervention</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="bg-white border border-slate-200 rounded-[3.5rem] p-12 flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                <Layers className="w-32 h-32 rotate-12" />
              </div>
              <div className="space-y-6 relative z-10">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Academic Load</p>
                <div className="space-y-2">
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{data.mySubjects?.length || 0}</p>
                  <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest italic">Assigned Faculties</p>
                </div>
              </div>
              <button onClick={() => router.push('/instructor/subjects')} className="h-16 w-full bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-[1.5rem] mt-10 transition-all font-black text-[12px] uppercase tracking-[0.2em] border border-slate-100 hover:border-indigo-600 flex items-center justify-center gap-3">
                 REVIEW ARCHIVE <ArrowUpRight className="w-4 h-4" strokeWidth={3} />
              </button>
           </div>
        </div>
      )}
 
      {/* ─── Principal Information Architecture ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Surface - Assignments & Audit */}
        <div className="lg:col-span-8 space-y-12">
           {/* Section Header */}
           <div className="flex items-center justify-between px-6">
              <div className="space-y-1">
                 <h3 className="text-[18px] font-black text-slate-900 tracking-[-0.02em]">Audit Intelligence Stream</h3>
                 <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Monitoring scholar submissions in real-time</p>
              </div>
              <Button onClick={() => router.push('/instructor/submissions')} variant="link" className="text-indigo-600 font-black text-[12px] uppercase tracking-widest hover:no-underline flex items-center gap-2 group">
                 Open Registry <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </Button>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {!data.recentSubmissions || data.recentSubmissions.length === 0 ? (
                <div className="md:col-span-2 bg-white border border-dashed border-slate-200 rounded-[3rem] py-32 text-center group">
                   <div className="h-20 w-20 flex items-center justify-center rounded-[2rem] bg-slate-50 mx-auto mb-8 group-hover:scale-110 transition-transform">
                     <ShieldCheck className="w-8 h-8 text-slate-200" />
                   </div>
                   <p className="text-[16px] font-bold text-slate-400 italic">Audit queue synchronized. Zero pending identities identified.</p>
                </div>
              ) : (
                data.recentSubmissions.slice(0, 4).map((sub, idx) => (
                  <PeakAuditCard key={idx} sub={sub} idx={idx} />
                ))
              )}
           </div>
        </div>
 
        {/* Right Surface - Broadcasting & Navigation */}
        <div className="lg:col-span-4 space-y-12">
           <div className="space-y-6 px-6">
               <h3 className="text-[18px] font-black text-slate-900 tracking-[-0.02em]">Satellite Uplink</h3>
               <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Active broadcast channels</p>
           </div>
 
           <div className="bg-white border border-slate-200 rounded-[3.5rem] p-8 space-y-8 shadow-sm">
              {data.upcomingClasses.length === 0 ? (
                <div className="py-24 text-center">
                   <Video className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                   <p className="text-[13px] font-bold text-slate-400 italic">Zero broadcasts identified.</p>
                </div>
              ) : (
                data.upcomingClasses.map((live, idx) => (
                  <PeakLiveCard key={idx} live={live} />
                ))
              )}
           </div>
 
           {/* Navigation QuickLinks */}
           <div className="grid grid-cols-2 gap-4">
              <PeakNavButton label="Courses" icon={<Layers />} href="/instructor/courses" />
              <PeakNavButton label="Scholars" icon={<Users />} href="/instructor/students" />
              <PeakNavButton label="Broadcast" icon={<Video />} href="/instructor/live-classes" />
              <PeakNavButton label="Registry" icon={<Search />} href="/instructor/gradebook" />
           </div>
        </div>
      </div>
    </div>
  )
}
 
function PeakMetric({ label, value, icon, color, trend, delay }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
  }
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-slate-200 rounded-[3rem] p-10 space-y-8 group hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:scale-[1.02] transition-all cursor-default relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-700">
        {React.cloneElement(icon, { size: 100 })}
      </div>
      <div className={`h-16 w-16 rounded-[1.6rem] ${colors[color]} border flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 shadow-sm`}>
        {icon}
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{label}</p>
        <div className="flex items-baseline gap-4">
          <p className="text-5xl font-black text-slate-900 tracking-[-0.02em]">{value}</p>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 uppercase tracking-widest">{trend}</span>
        </div>
      </div>
    </motion.div>
  )
}
 
function PeakAuditCard({ sub, idx }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex items-center justify-between hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-6">
         <div className="h-16 w-16 rounded-[1.6rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-700 shadow-sm relative overflow-hidden">
            <FileText className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
            <div className="absolute top-0 right-0 h-4 w-4 bg-amber-500 border-[3px] border-white group-hover:border-indigo-600 rounded-full" />
         </div>
         <div className="space-y-1">
            <p className="text-[18px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{sub.assignment_id?.title || 'Intelligence Task'}</p>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{sub.student_id?.name || 'Authorized Scholar'}</p>
         </div>
      </div>
      <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
         <ChevronRight className="w-5 h-5" strokeWidth={3} />
      </div>
    </motion.div>
  )
}
 
function PeakLiveCard({ live }: any) {
  return (
    <div className="p-6 rounded-[2.5rem] bg-slate-50 hover:bg-slate-900 group transition-all duration-500 cursor-pointer relative overflow-hidden border border-transparent hover:scale-[1.02]">
       <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
             <div className="h-12 w-12 rounded-[1.2rem] bg-white group-hover:bg-rose-600 flex items-center justify-center shadow-sm transition-all duration-500 border border-slate-100 group-hover:border-rose-600">
                <Video className="w-5 h-5 text-rose-600 group-hover:text-white" />
             </div>
             <Badge className="bg-rose-500 group-hover:bg-white group-hover:text-rose-600 border-0 text-[10px] font-black px-3 py-1">LIVE IN 12MIN</Badge>
          </div>
          <div className="space-y-1">
             <p className="text-[18px] font-black group-hover:text-white tracking-tight leading-tight">{live.title}</p>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{live.course_id?.title}</p>
          </div>
          <div className="flex items-center gap-2 font-black text-[12px] group-hover:text-rose-400 transition-colors">
             <Clock className="w-4 h-4" /> {new Date(live.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
       </div>
    </div>
  )
}
 
function PeakNavButton({ label, icon, href }: any) {
  const router = useRouter()
  return (
    <button 
      onClick={() => router.push(href)}
      className="h-[120px] rounded-[2.5rem] border border-slate-200 bg-white hover:bg-slate-900 hover:text-white transition-all duration-500 group flex flex-col items-center justify-center gap-4 hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
         {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
      </div>
      <span className="text-[12px] font-black uppercase tracking-widest">{label}</span>
    </button>
  )
}
 
function ContextMiniCard({ label, value, icon }: any) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all cursor-default">
       <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
          <p className="text-[18px] font-black text-slate-900 leading-none">{value}</p>
       </div>
    </div>
  )
}
