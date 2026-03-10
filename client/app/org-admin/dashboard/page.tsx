"use client"
 
import { useState, useEffect } from "react"
import { 
  Users, 
  ShoppingCart, 
  Zap, 
  DollarSign,
  TrendingUp,
  ShoppingCart as ShoppingCartIcon,
  Plus
} from "lucide-react"
import { getDashboardMetrics, getDashboardActivities } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { cn } from "../../../lib/utils"
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton } from "../../../components/org-admin/core/MinimalForm"
import { PlainChart } from "../../../components/org-admin/core/PlainChart"
import Link from "next/link"
 
export default function OrgAdminDashboard() {
  const { user, organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [activities, setActivities] = useState<any>(null)

  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCorporate = orgType === 'CORPORATE'
  const isSchool = orgType === 'SCHOOL'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'
 
  useEffect(() => {
    loadDashboardData()
  }, [])
 
  async function loadDashboardData() {
    setLoading(true)
    try {
      const [metricsData, activitiesData] = await Promise.all([
        getDashboardMetrics(),
        getDashboardActivities(10)
      ])
      if (metricsData.success) setMetrics(metricsData.data)
      if (activitiesData.success) setActivities(activitiesData.data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }
 
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Identifying Data Nodes...</p>
      </div>
    )
  }
 
  const chartData = metrics?.charts?.enrollmentGrowth?.map((m: any) => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m._id.month - 1],
    enrollments: m.count
  })) || []
 
  const topCourses = activities?.topCourses || []
  const recentStudents = activities?.recentEnrollments || []
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">
              {isCorporate ? 'Workforce Oversight' : isSchool ? 'School Hub' : isCollege ? 'Academic Registry' : 'At a Glance'}
            </h1>
            <p className="text-[14px] text-slate-500 font-medium italic">
              {isCorporate ? 'Monitoring employee growth and skill acquisition matrix.' : 
               isSchool ? 'Daily operations and student performance telemetry.' :
               'Comprehensive overview of your organization\'s digital learning ecosystem.'}
            </p>
         </div>
         <Link href="/org-admin/courses">
            <MinimalButton variant="text" className="text-[#F97316]">
               <Plus className="w-4 h-4 mr-2" />
               {isCorporate ? 'Assign Training' : 'Add Content'}
            </MinimalButton>
         </Link>
      </div>
 
      {/* ─── Metric Matrix ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard 
           label={isCorporate ? "Total Workforce" : isSchool ? "Total Students" : "Total Learners"} 
           value={metrics?.metrics?.totalStudents?.toLocaleString() || 0} 
           trend={metrics?.metrics?.trends?.students}
           subtext="Active engagement"
         />
         <MetricCard 
           label={isCorporate ? "Active Assignments" : "Total Products"} 
           value={metrics?.metrics?.activeCourses || 0} 
           subtext={isCorporate ? "Current training" : "Live and selling"}
         />
         <MetricCard 
           label={isSchool ? "Live Classes" : "Interactive Sessions"} 
           value={metrics?.metrics?.liveClassesCount || 0} 
           trend={metrics?.metrics?.trends?.liveSessions}
           subtext="Scheduled this week"
         />
         <MetricCard 
           label={isCorporate ? "Skill Index" : "Total Revenue"} 
           value={isCorporate ? `${metrics?.metrics?.skillIndex || 85}%` : `₹${(metrics?.metrics?.totalRevenue || 0).toLocaleString()}`} 
           trend={metrics?.metrics?.trends?.revenue}
           subtext={isCorporate ? "Avg proficiency" : "Marketplace performance"}
         />
      </div>
 
      {/* ─── Analytics Insight ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <FlatCard className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-slate-900">Acquisition Analytics</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Learnyst Insight: Student acquisition trends across 6 months.</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                     <span className="text-[11px] font-bold text-slate-500 uppercase">Acquisition</span>
                  </div>
               </div>
            </div>
            <PlainChart data={chartData} type="line" dataKey="enrollments" />
         </FlatCard>
 
         <FlatCard className="lg:col-span-4 space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-[16px] font-bold text-slate-900">Top Products</h3>
               <span className="text-[11px] font-bold text-[#F97316] uppercase">High Volume</span>
            </div>
            <div className="space-y-6">
               {topCourses.map((course: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-1.5 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                     <p className="text-[13.5px] font-bold text-[#3B82F6] truncate uppercase italic">{course.title}</p>
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{course.enrollments} Enrollments</span>
                        <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-widest">{course.rate}% Growth</span>
                     </div>
                  </div>
               ))}
               {topCourses.length === 0 && (
                  <p className="text-[13px] text-slate-400 font-medium italic text-center py-10">Marketplace idle. No product telemetry identified.</p>
               )}
            </div>
         </FlatCard>
      </div>
 
      {/* ─── Recent Telemetry ───────────────────────────────────────── */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <div className="space-y-1">
               <h3 className="text-[16px] font-bold text-slate-900">Recent Enrollments</h3>
               <p className="text-[12px] text-slate-500 font-medium">Live transaction stream from marketplace infrastructure.</p>
            </div>
            <Link href="/org-admin/users?role=student" className="text-[13.5px] font-bold text-[#3B82F6] hover:underline">
               View All Learners →
            </Link>
         </div>
 
         <FlatCard noPadding>
            <TextTable headers={["Learner Profile", "Product / Program", "Access Type", "Transaction Date", "Hub"]}>
               {recentStudents.map((enr: any) => (
                  <TextRow key={enr._id}>
                     <TextCell bold>
                        <div className="flex flex-col">
                           <span>{enr.student_id?.name || 'Standard User'}</span>
                           <span className="text-[11px] text-slate-400 font-medium lowercase tracking-tighter opacity-70">{enr.student_id?.email}</span>
                        </div>
                     </TextCell>
                     <TextCell className="uppercase italic text-[#3B82F6]">{enr.course_id?.title}</TextCell>
                     <TextCell>
                        <span className={cn(
                           "text-[10px] font-bold uppercase tracking-widest",
                           enr.enrollmentType === 'paid' ? "text-[#F97316]" : "text-slate-500"
                        )}>
                           {enr.enrollmentType === 'paid' ? 'Paid Access' : 'Free / Platform'}
                        </span>
                     </TextCell>
                     <TextCell className="text-slate-500">{new Date(enr.createdAt).toLocaleDateString()}</TextCell>
                     <TextCell className="text-[#3B82F6] font-bold">LMS-CORE</TextCell>
                  </TextRow>
               ))}
               {recentStudents.length === 0 && (
                  <TextRow>
                     <TextCell colSpan={5} className="text-center py-20 text-slate-400 font-medium italic">
                        No enrollments identified. Standby for student acquisition.
                     </TextCell>
                  </TextRow>
               )}
            </TextTable>
         </FlatCard>
      </div>
 
    </div>
  )
}
 
function MetricCard({ label, value, trend, subtext }: { label: string, value: string | number, trend?: string, subtext?: string }) {
   const isPositive = trend?.startsWith('+')
   return (
      <FlatCard className="flex flex-col gap-4">
         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest opacity-60 italic">// {label}</p>
         <div className="flex items-end justify-between">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">{value}</h3>
            {trend && (
               <span className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter",
                  isPositive ? "text-[#10B981] bg-green-50" : "text-[#EF4444] bg-red-50"
               )}>
                  {trend}
               </span>
            )}
         </div>
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{subtext}</p>
      </FlatCard>
   )
}
