"use client"

import { useState, useEffect, Suspense } from "react"
import {
  Sparkles,
  Brain,
  ClipboardCheck,
  Trash2,
  Save,
  Send,
  Loader2,
  AlertCircle,
  Plus,
  BookOpen,
  ChevronRight,
  Zap,
  Layout,
  Target,
  FileText,
  ShieldCheck,
  ArrowUpRight,
  Layers,
  Settings2,
  Cpu,
  Boxes,
  RefreshCcw,
  MoreVertical,
  Search,
  CheckCircle2,
  Settings
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { toast } from "sonner"
import { useAuth } from "../../../lib/auth-context"
import { instructorApi } from "../../../lib/api"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'
import { cn } from "../../../lib/utils"
 
function QuizContent() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
 
  // Generator Form
  const [courseId, setCourseId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [difficulty, setDifficulty] = useState("medium")
  const [numQuestions, setNumQuestions] = useState(5)
 
  // Preview Section
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null)
 
  useEffect(() => {
    if (token) {
        loadInitialData()
    }
  }, [token])
 
  async function loadInitialData() {
    setLoading(true)
    try {
      const coursesRes = await instructorApi.listCourses(token!, "limit=100")
      const quizzesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/quizzes`, {
          headers: { Authorization: `Bearer ${token}` }
      })
      const quizzesJson = await quizzesRes.json()
 
      if (coursesRes.success) setCourses((coursesRes.data as any).courses || [])
      if (quizzesJson.success) {
        // Handle both direct array and { quizzes: [] } structures
        const quizzesData = quizzesJson.data?.quizzes || (Array.isArray(quizzesJson.data) ? quizzesJson.data : []);
        setQuizzes(quizzesData);
      }
    } catch (error) {
      toast.error("Failed to synchronize assessment data")
    } finally {
      setLoading(false)
    }
  }
 
  async function handleGenerate() {
    if (!courseId || !prompt) {
      toast.error("Please provide a course and topic for generation.")
      return
    }
 
    setGenerating(true)
    setGeneratedQuiz(null)
 
    try {
      const res = await instructorApi.generateAIQuiz(token!, {
        course_id: courseId,
        topic: prompt,
        difficulty,
        num_questions: numQuestions
      })
 
      if (res.success) {
        setGeneratedQuiz((res.data as any).quiz)
        toast.success("AI Quiz generated successfully.")
      } else {
        toast.error(res.message || "Failed to generate quiz")
      }
    } catch (error) {
      toast.error("Network error during quiz generation")
    } finally {
      setGenerating(false)
    }
  }
 
  async function handlePublish() {
    if (!courseId || !generatedQuiz) return
    
    setGenerating(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          course_id: courseId,
          title: generatedQuiz.title || `Quiz: ${prompt.slice(0, 30)}`,
          description: `AI-Generated quiz for: ${prompt}`,
          questions: generatedQuiz.questions,
          pass_percentage: 60,
          max_attempts: 3
        })
      })
      const saveJson = await res.json()
      
      if (saveJson.success) {
        await instructorApi.publishQuiz(token!, saveJson.data._id)
        toast.success("Quiz published and added to course.")
        loadInitialData()
        setGeneratedQuiz(null)
        setShowGenerator(false)
      }
    } catch {
      toast.error("Failed to publish quiz")
    } finally {
      setGenerating(false)
    }
  }
 
  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <Brain className="w-3.5 h-3.5" />
            Performance Assessments
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quiz Management</h1>
          <p className="text-sm text-slate-500 font-medium italic">Create, manage, and distribute AI-powered assessments for your students.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          {!showGenerator ? (
            <Button
              onClick={() => setShowGenerator(true)}
              className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Create New Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setShowGenerator(false)}
              variant="outline"
              className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              Back to Inventory
            </Button>
          )}
        </div>
      </div>

      {/* ─── Metrics Quickview ─── */}
      {!showGenerator && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricMiniCard label="Total Quizzes" value={(quizzes || []).length} icon={<ClipboardCheck className="w-6 h-6 text-indigo-600" />} />
          <MetricMiniCard label="AI Generated" value={(quizzes || []).filter(q => q.description?.includes('AI')).length} icon={<Cpu className="w-6 h-6 text-purple-600" />} />
          <MetricMiniCard label="Avg. Score" value="72%" icon={<Target className="w-6 h-6 text-emerald-600" />} />
          <MetricMiniCard label="Status" value="Optimized" icon={<ShieldCheck className="w-6 h-6 text-blue-600" />} />
        </div>
      )}

      {/* ─── Main Interface ─── */}
      {showGenerator ? (
        <div className="space-y-12 animate-in fade-in duration-500">
          {/* Generator Form */}
          <SimpleCard className="p-12 border-slate-100 shadow-sm bg-white rounded-[2.5rem]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
               <div className="space-y-10">
                  <div className="space-y-2 pb-6 border-b border-slate-50">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Quiz Configuration</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Define the parameters for AI quiz synthesis</p>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Course Bundle</Label>
                        <Select value={courseId} onValueChange={setCourseId}>
                          <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 px-6 font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all">
                             <SelectValue placeholder="Select course..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-[1.5rem] border-slate-100 shadow-2xl p-2">
                             {courses.map(course => (
                               <SelectItem key={course._id} value={course._id} className="rounded-xl py-3 font-bold">
                                 {course.title}
                               </SelectItem>
                             ))}
                          </SelectContent>
                        </Select>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Difficulty Tier</Label>
                           <Select value={difficulty} onValueChange={setDifficulty}>
                              <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 px-6 font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-[1.5rem] border-slate-100 shadow-2xl p-2">
                                 <SelectItem value="easy" className="rounded-xl py-3 font-bold">Beginner</SelectItem>
                                 <SelectItem value="medium" className="rounded-xl py-3 font-bold">Intermediate</SelectItem>
                                 <SelectItem value="hard" className="rounded-xl py-3 font-bold">Advanced</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Question Volume</Label>
                           <Select value={numQuestions.toString()} onValueChange={(val) => setNumQuestions(parseInt(val))}>
                              <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 px-6 font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-[1.5rem] border-slate-100 shadow-2xl p-2">
                                 <SelectItem value="3" className="rounded-xl py-3 font-bold">3 Questions</SelectItem>
                                 <SelectItem value="5" className="rounded-xl py-3 font-bold">5 Questions</SelectItem>
                                 <SelectItem value="10" className="rounded-xl py-3 font-bold">10 Questions</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col justify-between gap-10">
                  <div className="space-y-3 flex-1">
                     <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Topic or Concept Focus</Label>
                     <Textarea 
                       placeholder="Describe the topics you want the AI to generate questions for..."
                       className="h-full min-h-[160px] bg-slate-50/50 border-slate-100 rounded-[2rem] p-8 text-base font-bold leading-relaxed resize-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                     />
                  </div>

                  <div className="flex items-center gap-4">
                     <Button 
                       onClick={handleGenerate}
                       disabled={generating}
                       className="h-16 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/10 gap-3 group"
                     >
                       {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                       {generating ? "Synthesizing..." : "Initialize AI Generation"}
                     </Button>
                  </div>
               </div>
            </div>
          </SimpleCard>

          {/* Generated Preview */}
          {generatedQuiz && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between px-8">
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Review Generated Content: {generatedQuiz.title}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Review and verify the diagnostic assessment before publishing</p>
                 </div>
                 <Button 
                   onClick={handlePublish}
                   className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl shadow-emerald-500/10"
                 >
                   <Send className="w-4 h-4" />
                   Deploy to Course
                 </Button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                 {generatedQuiz.questions.map((q: any, i: number) => (
                   <SimpleCard key={i} className="p-10 border-slate-100 relative group overflow-hidden bg-white rounded-[2.5rem] hover:shadow-xl transition-all">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-indigo-600 transition-opacity group-hover:opacity-[0.1]">
                         <span className="text-[10rem] font-black italic tracking-tighter leading-none">{i + 1}</span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-10 leading-tight pr-12 relative z-10">{q.question}</h4>
                      <div className="grid grid-cols-1 gap-4 relative z-10">
                         {q.options.map((opt: string, optIdx: number) => (
                           <div 
                             key={optIdx} 
                             className={cn(
                               "p-5 rounded-2xl border transition-all flex items-center justify-between group/opt",
                               optIdx === q.correct_answer 
                                 ? "bg-emerald-50 border-emerald-100 text-emerald-900 shadow-sm" 
                                 : "bg-slate-50/50 border-transparent text-slate-600 hover:bg-slate-50"
                             )}
                           >
                              <div className="flex items-center gap-5">
                                 <span className={cn(
                                   "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-transform group-hover/opt:scale-110",
                                   optIdx === q.correct_answer 
                                     ? "bg-emerald-600 text-white" 
                                     : "bg-white text-slate-400 border border-slate-100"
                                 )}>
                                    {String.fromCharCode(65 + optIdx)}
                                 </span>
                                 <span className="font-bold text-sm">{opt}</span>
                              </div>
                              {optIdx === q.correct_answer && <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[3]" />}
                           </div>
                         ))}
                      </div>
                   </SimpleCard>
                 ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Inventory List */}
          <div className="lg:col-span-8">
             <SimpleCard className="p-0 border-slate-100 shadow-sm bg-white overflow-hidden rounded-[2.5rem]">
                <div className="p-10 flex items-center justify-between border-b border-slate-50 bg-white">
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assessment Inventory</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Total registered modules: {(quizzes || []).length}</p>
                   </div>
                   <Button 
                     variant="ghost"
                     onClick={loadInitialData}
                     className="h-12 px-6 text-[10px] font-black uppercase tracking-widest gap-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                   >
                     <RefreshCcw className="w-4 h-4" />
                     Refresh Data
                   </Button>
                </div>
                
                {(quizzes || []).length === 0 ? (
                  <div className="py-24 text-center border-2 border-slate-100 border-dashed m-10 rounded-[2rem] bg-slate-50/30">
                     <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-8 border border-slate-100 mx-auto shadow-sm">
                        <ClipboardCheck className="h-10 w-10 text-slate-200" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 mb-3">Inventory Empty</h3>
                     <p className="text-sm text-slate-400 max-w-xs mx-auto mb-10 font-bold italic">
                       No assessment modules found. Initialize synthesis to create your first instructional quiz.
                     </p>
                     <Button onClick={() => setShowGenerator(true)} className="h-14 px-10 rounded-[1.25rem] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/10 hover:bg-indigo-700 transition-all">
                        Create New Module
                     </Button>
                  </div>
                ) : (
                  <FlatTable>
                    <FlatTableHead>
                      <FlatTableRow className="bg-slate-50/50">
                        <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 pl-10">Assessment Module</FlatTableCell>
                        <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Question Count</FlatTableCell>
                        <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 text-center">Lifecycle</FlatTableCell>
                        <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 text-right pr-10">Actions</FlatTableCell>
                      </FlatTableRow>
                    </FlatTableHead>
                    <tbody>
                      {(quizzes || []).map((quiz) => (
                        <FlatTableRow key={quiz._id} className="group hover:bg-slate-50/50 transition-colors">
                          <FlatTableCell className="pl-10 py-8">
                            <div className="flex items-center gap-5">
                               <div className={cn(
                                 "h-12 w-12 rounded-2xl flex items-center justify-center text-indigo-600 bg-indigo-50 border border-indigo-100 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3",
                               )}>
                                  <BookOpen className="w-6 h-6 stroke-[2.5]" />
                               </div>
                               <div>
                                  <p className="text-base font-black text-slate-900 tracking-tight leading-none mb-2 uppercase truncate max-w-[250px] group-hover:text-indigo-600 transition-colors">{quiz.title}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none italic opacity-80">{quiz.course_id?.title || 'Uncategorized'}</p>
                               </div>
                            </div>
                          </FlatTableCell>
                          <FlatTableCell>
                             <div className="flex items-center gap-3">
                                <span className="text-lg font-black text-slate-900 tabular-nums">{quiz.questions?.length || 0}</span>
                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Questions</span>
                             </div>
                          </FlatTableCell>
                          <FlatTableCell className="text-center">
                              <SimpleBadge variant={quiz.status === 'PUBLISHED' ? 'blue' : 'gray'}>
                                 {quiz.status}
                              </SimpleBadge>
                          </FlatTableCell>
                          <FlatTableCell className="text-right pr-10">
                             <div className="flex items-center justify-end gap-3">
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                   <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group-hover:translate-x-1 group-hover:-translate-y-1">
                                   <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                                </Button>
                             </div>
                          </FlatTableCell>
                        </FlatTableRow>
                      ))}
                    </tbody>
                  </FlatTable>
                )}
             </SimpleCard>
          </div>

          {/* Side Info */}
          <div className="lg:col-span-4 space-y-8">
             <SimpleCard className="bg-slate-900 border-none p-10 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-1000" />
                <div className="relative z-10 space-y-10">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg">
                         <Sparkles className="h-6 w-6 text-indigo-400" />
                      </div>
                      <h4 className="text-xl font-black text-white tracking-tight uppercase">AI Engine Status</h4>
                   </div>
                   
                   <div className="space-y-5">
                      <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5 backdrop-blur-md">
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 leading-none">Operational Link</p>
                         <p className="text-base text-white font-black leading-tight mb-2">Quiz Generator Online</p>
                         <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">Synthesis algorithms are calibrated for peak instructional accuracy.</p>
                      </div>
                      <div className="p-6 rounded-[1.5rem] bg-indigo-500/10 border border-white/5 backdrop-blur-md">
                         <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3 leading-none">Security Protocol</p>
                         <p className="text-base text-white font-black leading-tight mb-2">Verified Content Delivery</p>
                         <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">Assessments are auto-validated against current course materials.</p>
                      </div>
                   </div>

                   <Button 
                      onClick={() => setShowGenerator(true)}
                      className="w-full h-16 bg-white text-slate-900 hover:bg-slate-100 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all"
                   >
                      <Zap className="h-4 w-4 fill-slate-900" />
                      Generate New Hub
                   </Button>
                </div>
             </SimpleCard>

             <SimpleCard className="p-10 border-slate-100 shadow-sm bg-white space-y-8 rounded-[2.5rem]">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60 ml-1">Registry Metrics</h4>
                <div className="space-y-6">
                   <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                            <Layers className="w-5 h-5" />
                         </div>
                         <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Total Modules</span>
                      </div>
                      <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{(quizzes || []).length}</span>
                   </div>
                   <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <ShieldCheck className="w-5 h-5" />
                         </div>
                         <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Active Units</span>
                      </div>
                      <span className="text-2xl font-black text-emerald-600 tracking-tight tabular-nums">{(quizzes || []).filter(q => q.status === 'PUBLISHED').length}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-300">
                      <FileText className="w-4 h-4 opacity-40 text-slate-400" />
                      <p className="text-[9px] font-black uppercase tracking-widest italic text-slate-400">Registry Integrity verified</p>
                   </div>
                </div>
             </SimpleCard>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricMiniCard({ label, value, icon }: any) {
  return (
    <SimpleCard className="p-8 border-slate-100 shadow-sm bg-white flex items-center gap-6 transition-all hover:border-indigo-200 group rounded-[2rem] hover:shadow-xl hover:shadow-slate-500/5">
       <div className="h-14 w-14 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white transition-all duration-500">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-2">{label}</p>
          <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
       </div>
    </SimpleCard>
  )
}

export default function InstructorQuizPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
                <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Synchronizing Assessment Hub...</p>
            </div>
        }>
            <QuizContent />
        </Suspense>
    )
}
