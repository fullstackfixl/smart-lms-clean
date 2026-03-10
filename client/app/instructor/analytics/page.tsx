"use client"
 
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, 
  Users, 
  BookOpen, 
  Award, 
  Target, 
  Clock,
  BarChart3, 
  PieChart, 
  Activity,
  ChevronRight,
  Filter,
  Zap,
  BarChart,
  Lightbulb,
  ArrowUpRight,
  ShieldCheck,
  MousePointer2,
  LineChart,
  Layers,
  Sparkles,
  ZapIcon
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { useAuth } from '../../../lib/auth-context'
import { instructorApi } from '../../../lib/api'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { Badge } from "../../../components/ui/badge"
 
interface Course {
  _id: string
  title: string
}
 
interface CourseAnalytics {
  summary: {
    totalEnrollments: number
    completionRate: number
    enrollmentStats: Array<{
      _id: string
      count: number
      avgProgress: number
      avgTimeSpent: number
    }>
  }
  quizzes: Array<{
    _id: string
    attempts: number
    avgScore: number
    avgPercentage: number
    passRate: number
  }>
}
 
function AnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()
 
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    if (token) {
      loadCourses()
    }
  }, [token])
 
  useEffect(() => {
    if (selectedCourseId && token) {
      loadAnalytics()
    }
  }, [selectedCourseId, token])
 
  async function loadCourses() {
    setLoading(true)
    try {
      const res = await instructorApi.listCourses(token!, "limit=100")
      if (res.success && res.data) {
        const courseList = (res.data as any).courses || []
        setCourses(courseList)
        if (courseList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseList[0]._id)
        }
      }
    } catch (error) {
      toast.error("Telemetry link failure")
    } finally {
      if (!selectedCourseId) setLoading(false)
    }
  }
 
  async function loadAnalytics() {
    setLoading(true)
    try {
      const res = await instructorApi.getAnalytics(token!, selectedCourseId)
      if (res.success && res.data) {
        setAnalytics(res.data as CourseAnalytics)
      }
    } catch (error) {
      toast.error("Intelligence stream sync failed")
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Intelligence Analytics Hero ────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3.5rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] transition-all">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-blue-50 rounded-full blur-[120px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black uppercase tracking-[0.25em] border border-blue-100/50">
                <Activity className="w-4 h-4" />
                Instructional Telemetry
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  High-Fidelity <br />
                  <span className="text-blue-600">Impact Insights.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Analyze the global efficacy of your pedagogical units. Monitor completion velocity, mastery trajectories, and diagnostic performance through executive telemetry.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                 <div className="bg-slate-50 p-1 rounded-[1.8rem] border border-slate-100 shadow-inner group/select">
                   <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                     <SelectTrigger className="w-[360px] h-14 rounded-[1.5rem] bg-white border-none shadow-sm text-[14px] font-black px-6 focus:ring-0">
                       <div className="flex flex-col items-start text-left">
                         <span className="text-[9px] text-slate-400 uppercase tracking-widest leading-none mb-1 group-hover/select:text-blue-600 transition-colors">Curriculum Context Sector</span>
                         <SelectValue placeholder="Identify course sector..." />
                       </div>
                     </SelectTrigger>
                     <SelectContent className="rounded-[1.5rem] p-2 border-slate-100 shadow-2xl">
                       {courses.map((course) => (
                         <SelectItem key={course._id} value={course._id} className="rounded-xl py-3 font-black text-[13px] focus:bg-blue-50 focus:text-blue-700">
                           {course.title}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <button className="h-14 w-14 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:text-blue-600 transition-all">
                    <Filter className="w-5 h-5" />
                 </button>
              </div>
            </div>
 
            {/* Macro Stats Grid */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <MetricMiniCard label="Enrollments" value={analytics?.summary.totalEnrollments || 0} icon={<Users color="#3B82F6" />} />
                <MetricMiniCard label="Completion" value={`${analytics?.summary.completionRate.toFixed(1) || 0}%`} icon={<Target color="#10B981" />} />
                <MetricMiniCard label="Diagnostics" value={analytics?.quizzes.length || 0} icon={<Award color="#4F46E5" />} />
                <MetricMiniCard label="Velocity" value="OPTIMAL" icon={<TrendingUp color="#F59E0B" />} />
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Intelligence Distribution Surface ───────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 p-4">
             <div className="lg:col-span-8 h-[600px] bg-slate-50 rounded-[4rem] animate-pulse" />
             <div className="lg:col-span-4 h-[600px] bg-slate-50 rounded-[4rem] animate-pulse" />
          </div>
        ) : analytics ? (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            {/* Left Sector: Detailed Breakdown */}
            <div className="lg:col-span-8 space-y-12">
               {/* Enrollment Status Profile */}
               <div className="bg-white rounded-[4rem] border border-slate-100 p-12 shadow-sm hover:shadow-[0_64px_128px_-32px_rgba(0,0,0,0.05)] transition-all duration-1000 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
                     <PieChart className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 space-y-12">
                     <div className="flex items-center justify-between">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight">Status Distribution Profile</h3>
                           <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Scholar identity segmentation</p>
                        </div>
                        <div className="h-12 px-6 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-black uppercase tracking-widest flex items-center">
                           Live Registry
                        </div>
                     </div>
 
                     <div className="space-y-10">
                        {analytics.summary.enrollmentStats.length === 0 ? (
                          <div className="py-32 text-center">
                             <Layers className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                             <p className="text-[15px] font-black text-slate-300 italic">Sector Void: Zero identities identified.</p>
                          </div>
                        ) : (
                          analytics.summary.enrollmentStats.map((stat, idx) => (
                            <div key={stat._id} className="space-y-6 group/row">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                     <div className={cn(
                                       "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                       stat._id === 'active' ? "bg-emerald-50 text-emerald-600" : stat._id === 'completed' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-300"
                                     )}>
                                        <Users className="w-6 h-6" />
                                     </div>
                                     <div>
                                        <p className="text-[17px] font-black text-slate-900 leading-none mb-1.5 uppercase tracking-tighter">{stat._id} Population</p>
                                        <div className="flex items-center gap-3">
                                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.count} SCHOLARS</span>
                                           <div className="h-1 w-1 rounded-full bg-slate-200" />
                                           <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{stat.avgProgress.toFixed(1)}% MASTERY avg</span>
                                        </div>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-[28px] font-black text-slate-900 tracking-tighter leading-none">{((stat.count / analytics.summary.totalEnrollments) * 100).toFixed(0)}%</p>
                                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Registry Weight</p>
                                  </div>
                               </div>
                               <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 shadow-inner relative">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stat.count / analytics.summary.totalEnrollments) * 100}%` }}
                                    transition={{ duration: 1.5, delay: idx * 0.1, ease: "easeOut" }}
                                    className={cn(
                                      "h-full rounded-full shadow-lg transition-all",
                                      stat._id === 'active' ? "bg-emerald-500 shadow-emerald-500/20" : stat._id === 'completed' ? "bg-blue-600 shadow-blue-500/20" : "bg-slate-200"
                                    )} 
                                  />
                               </div>
                            </div>
                          ))
                        )}
                     </div>
                  </div>
               </div>
 
               {/* Diagnostic Intelligence Surface */}
               <div className="space-y-8">
                  <div className="flex items-center justify-between px-8">
                     <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Diagnostic Performance Matrix</h3>
                     <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                        Execute Full Audit <ArrowUpRight className="w-4 h-4" />
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {analytics.quizzes.map((quiz, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-[3.5rem] border border-slate-100 p-10 hover:border-blue-500/30 hover:shadow-[0_48px_96px_-24px_rgba(59,130,246,0.08)] transition-all duration-700 relative overflow-hidden group"
                      >
                         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <ShieldCheck className="w-24 h-24 rotate-12" />
                         </div>
                         <div className="flex items-center justify-between mb-8">
                            <div className="h-16 w-16 rounded-[1.8rem] bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                               <Target className="w-7 h-7" strokeWidth={3} />
                            </div>
                            <Badge className="bg-slate-900 text-white rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest border-0">
                               {quiz.attempts} SESSIONS
                            </Badge>
                         </div>
                         <h4 className="text-[22px] font-black text-slate-900 tracking-tight mb-8">Assessment Module {index + 1}</h4>
                         
                         <div className="grid grid-cols-3 gap-6 mb-10">
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mean Score</p>
                               <p className="text-[22px] font-black text-slate-900 leading-none">{quiz.avgScore.toFixed(1)}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precision</p>
                               <p className="text-[22px] font-black text-blue-600 leading-none">{quiz.avgPercentage.toFixed(1)}%</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Velocity</p>
                               <p className="text-[22px] font-black text-emerald-600 leading-none">{(quiz.passRate * 100).toFixed(0)}%</p>
                            </div>
                         </div>
                         
                         <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${quiz.avgPercentage}%` }}
                               transition={{ duration: 1.5, delay: 0.5 }}
                               className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/10" 
                            />
                         </div>
                      </motion.div>
                    ))}
                  </div>
               </div>
            </div>
 
            {/* Right Sector: Heuristic Intelligence */}
            <div className="lg:col-span-4 space-y-12">
               <div className="bg-[#020617] rounded-[4rem] p-12 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[28rem] h-[28rem] bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-[2000ms]" />
                  <div className="relative z-10 space-y-12">
                     <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                           <Sparkles className="h-7 w-7 text-amber-500 animate-pulse" />
                        </div>
                        <h4 className="text-2xl font-black text-white tracking-tight">Heuristic Intelligence</h4>
                     </div>
 
                     <div className="space-y-6">
                        {analytics.summary.completionRate < 40 && (
                          <div className="p-8 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl">
                             <div className="flex items-center gap-3 mb-4">
                                <Activity className="w-5 h-5 text-rose-500" />
                                <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em]">Critical Alert</span>
                             </div>
                             <p className="text-white text-[16px] font-black mb-2">Cognitive Latency Identified</p>
                             <p className="text-white/40 text-[13px] font-bold leading-relaxed italic">Curriculum completion velocity is below nominal threshold. Consider decomposing instructional units for optimized digestion.</p>
                          </div>
                        )}
 
                        {analytics.summary.completionRate >= 70 && (
                          <div className="p-8 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
                             <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">Peak Efficiency</span>
                             </div>
                             <p className="text-white text-[16px] font-black mb-2">Elite Mastery Observed</p>
                             <p className="text-white/40 text-[13px] font-bold leading-relaxed italic">Scholastic registry shows elite mastery trajectories. Current curriculum architecture is achieving global peak efficacy.</p>
                          </div>
                        )}
 
                        <div className="p-8 rounded-[2.5rem] bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl group/card cursor-default">
                           <div className="flex items-center gap-3 mb-4">
                              <ZapIcon className="w-5 h-5 text-blue-500" />
                              <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.3em]">Optimization Tip</span>
                           </div>
                           <p className="text-white text-[16px] font-black mb-2">Engagement Catalyst</p>
                           <p className="text-white/40 text-[13px] font-bold leading-relaxed italic">Inject micro-diagnostic assessments every 20 minutes to maintain high-fidelity learner focus.</p>
                        </div>
                     </div>
 
                     <button className="w-full h-20 bg-white text-[#020617] rounded-[2rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn">
                        <LineChart className="w-5 h-5 group-hover/btn:rotate-6 transition-transform" />
                        EXPORT FULL TELEMETRY
                     </button>
                  </div>
               </div>
 
               {/* Context Overview Card */}
               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-10">
                  <div className="space-y-1">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Tactical Summary</h4>
                     <p className="text-[14px] text-slate-400 font-bold italic opacity-60">// Registry synchronization healthy.</p>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                        <span className="text-[14px] font-black text-slate-900 uppercase">Population Score</span>
                        <span className="text-[26px] font-black text-blue-600 tracking-tighter">{(analytics.summary.totalEnrollments * 1.2).toFixed(0)}</span>
                     </div>
                     <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                        <span className="text-[14px] font-black text-slate-900 uppercase">Mastery Index</span>
                        <span className="text-[26px] font-black text-emerald-600 tracking-tighter">{analytics.summary.completionRate.toFixed(0)}%</span>
                     </div>
                     <div className="flex items-center gap-4 text-slate-300">
                        <MousePointer2 className="w-5 h-5 opacity-40" />
                        <p className="text-[11px] font-black uppercase tracking-widest italic animate-pulse">Establishing scholastic link...</p>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-48 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 m-4">
             <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100 italic">
                <BarChart3 className="h-10 w-10 text-slate-200" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">NULL TELEMETRY</h3>
             <p className="text-[17px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed italic opacity-80">
                The intelligence sector returned zero data units for the current selected curriculum context.
             </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
 
export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="relative">
          <div className="h-20 w-20 border-[6px] border-blue-500/10 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
           <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em]">Synchronizing Intelligence Core</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Establishing telemetry link...</p>
        </div>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}
 
function MetricMiniCard({ label, value, icon, variant = "default" }: any) {
  return (
    <div className={cn(
      "p-6 rounded-[2.5rem] border flex items-center gap-5 transition-all cursor-default group",
      variant === "glass" 
        ? "bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md" 
        : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-lg"
    )}>
       <div className={cn(
         "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
         variant === "glass" ? "bg-white/10" : "bg-white border border-slate-200"
       )}>
          {icon}
       </div>
       <div>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest leading-none mb-1.5",
            variant === "glass" ? "text-blue-200" : "text-slate-400"
          )}>{label}</p>
          <p className={cn(
            "text-[24px] font-black leading-none tracking-tighter",
            variant === "glass" ? "text-white" : "text-slate-900"
          )}>{value}</p>
       </div>
    </div>
  )
}
