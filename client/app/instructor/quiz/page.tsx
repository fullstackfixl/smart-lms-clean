"use client"
 
import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Boxes
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
import { Badge } from '../../../components/ui/badge'
import { toast } from "sonner"
import { useAuth } from "../../../lib/auth-context"
import { instructorApi } from "../../../lib/api"
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
      // Assuming a generic endpoint or similar logic as before
      const quizzesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/quizzes`, {
          headers: { Authorization: `Bearer ${token}` }
      })
      const quizzesJson = await quizzesRes.json()
 
      if (coursesRes.success) setCourses((coursesRes.data as any).courses || [])
      if (quizzesJson.success) setQuizzes(quizzesJson.data || [])
    } catch (error) {
      toast.error("Registry synchronization failure")
    } finally {
      setLoading(false)
    }
  }
 
  async function handleGenerate() {
    if (!courseId || !prompt) {
      toast.error("Contextual parameters incomplete.")
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
        setGeneratedQuiz(res.data.quiz)
        toast.success("AI Synthesis complete. Diagnostic module generated.")
      } else {
        toast.error(res.message || "Synthesis protocol interrupted")
      }
    } catch (error) {
      toast.error("Neural link severed")
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
          title: generatedQuiz.title || `Diagnostic Module: ${prompt.slice(0, 30)}`,
          description: `AI-Synthesized assessment for: ${prompt}`,
          questions: generatedQuiz.questions,
          pass_percentage: 60,
          max_attempts: 3
        })
      })
      const saveJson = await res.json()
      
      if (saveJson.success) {
        await instructorApi.publishQuiz(token!, saveJson.data._id)
        toast.success("Module deployed to curriculum stream.")
        loadInitialData()
        setGeneratedQuiz(null)
        setShowGenerator(false)
      }
    } catch {
      toast.error("Deployment protocol failure")
    } finally {
      setGenerating(false)
    }
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── AI Diagnostic Hero ───────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3.5rem] bg-indigo-600 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.3)] transition-all">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-white/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Brain className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                <Sparkles className="w-4 h-4 fill-white animate-pulse" />
                AI Neural Synthesis
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  Diagnostic <br />
                  <span className="text-indigo-200">Architecture Engine.</span>
                </h1>
                <p className="text-[19px] font-medium text-indigo-50 leading-relaxed max-w-xl opacity-90">
                  Synthesize high-fidelity diagnostic modules instantly. Transform abstract instructional concepts into rigorous assessment matrices through quantum AI.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                {!showGenerator && (
                  <button
                    onClick={() => setShowGenerator(true)}
                    className="h-20 px-12 bg-white text-indigo-600 rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] group"
                  >
                    <Zap className="w-6 h-6 fill-indigo-600 group-hover:rotate-12 transition-transform" />
                    INITIALIZE NEURAL GEN
                  </button>
                )}
                <button className="h-20 w-20 flex items-center justify-center rounded-[2.2rem] bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
                  <Boxes className="w-7 h-7" />
                </button>
              </div>
            </div>
 
            {/* Intelligence Stream Stats */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <MetricMiniCard variant="glass" label="Active Modules" value={quizzes.length} icon={<ClipboardCheck color="#fff" />} />
                <MetricMiniCard variant="glass" label="AI Synthesized" value={quizzes.filter(q => q.description?.includes('AI')).length + (generatedQuiz ? 1 : 0)} icon={<Cpu color="#fff" />} />
                <MetricMiniCard variant="glass" label="Global Pass" value="72%" icon={<Target color="#fff" />} />
                <MetricMiniCard variant="glass" label="Accuracy" value="98.4%" icon={<ShieldCheck color="#fff" />} />
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Assessment Control Interface ─── */}
      <AnimatePresence mode="wait">
        {showGenerator ? (
          <motion.div
            key="generator"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className="space-y-12"
          >
            {/* Parameter Configuration Surface */}
            <div className="bg-white rounded-[4rem] border border-slate-200 p-12 lg:p-20 shadow-[0_48px_96px_-24px_rgba(79,70,229,0.1)] relative overflow-hidden focus-within:border-indigo-500/30 transition-all">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
                 <Settings2 className="w-64 h-64" />
              </div>
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
                 <div className="space-y-12">
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Module Parameters</h3>
                        <p className="text-[15px] text-slate-400 font-medium italic">// Establish the instructional boundaries for neural content synthesis.</p>
                    </div>
 
                    <div className="space-y-10">
                       <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Target Curriculum Context</Label>
                          <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger className="h-20 rounded-[1.8rem] bg-slate-50 border-none px-8 font-black text-[16px] text-slate-900 focus:ring-[8px] focus:ring-indigo-500/5">
                               <SelectValue placeholder="Identify course sector..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-[1.8rem] p-3 border-slate-100 shadow-2xl">
                               {courses.map(course => (
                                 <SelectItem key={course._id} value={course._id} className="rounded-xl py-4 font-black text-slate-900 focus:bg-indigo-50 focus:text-indigo-700">
                                   {course.title}
                                 </SelectItem>
                               ))}
                            </SelectContent>
                          </Select>
                       </div>
 
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Complexity Vector</Label>
                             <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger className="h-20 rounded-[1.8rem] bg-slate-50 border-none px-8 font-black text-[16px] text-slate-900 focus:ring-[8px] focus:ring-indigo-500/5">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.8rem] p-3 border-slate-100 shadow-2xl">
                                   <SelectItem value="easy" className="rounded-xl py-4 font-black">STANDARD</SelectItem>
                                   <SelectItem value="medium" className="rounded-xl py-4 font-black">INTERMEDIATE</SelectItem>
                                   <SelectItem value="hard" className="rounded-xl py-4 font-black">ADVANCED</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                          <div className="space-y-4">
                             <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Module Density</Label>
                             <Select value={numQuestions.toString()} onValueChange={(val) => setNumQuestions(parseInt(val))}>
                                <SelectTrigger className="h-20 rounded-[1.8rem] bg-slate-50 border-none px-8 font-black text-[16px] text-slate-900 focus:ring-[8px] focus:ring-indigo-500/5">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-[1.8rem] p-3 border-slate-100 shadow-2xl">
                                   <SelectItem value="3" className="rounded-xl py-4 font-black">3 UNITS</SelectItem>
                                   <SelectItem value="5" className="rounded-xl py-4 font-black">5 UNITS</SelectItem>
                                   <SelectItem value="10" className="rounded-xl py-4 font-black">10 UNITS</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                       </div>
                    </div>
                 </div>
 
                 <div className="flex flex-col justify-between space-y-10">
                    <div className="space-y-4 flex-1">
                       <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Conceptual Context / Topic</Label>
                       <Textarea 
                         placeholder="Synthesize modules based on specific instructional concepts, transcripts, or notes..."
                         className="h-full min-h-[220px] bg-slate-50 border-none rounded-[2rem] p-10 text-[16px] font-bold text-slate-900 leading-relaxed placeholder-slate-300 shadow-inner focus:bg-white focus:ring-[8px] focus:ring-indigo-500/5 transition-all outline-none"
                         value={prompt}
                         onChange={(e) => setPrompt(e.target.value)}
                       />
                    </div>
 
                    <div className="flex items-center gap-6">
                       <button 
                         onClick={() => setShowGenerator(false)}
                         className="h-20 px-10 rounded-[1.8rem] border border-slate-200 text-[13px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                       >
                         Abort
                       </button>
                       <button 
                         onClick={handleGenerate}
                         disabled={generating}
                         className="h-20 flex-1 bg-indigo-600 text-white rounded-[1.8rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                       >
                         {generating ? <Loader2 className="w-7 h-7 animate-spin" /> : <Zap className="w-6 h-6 fill-white group-hover:rotate-12 transition-transform" strokeWidth={3} />}
                         {generating ? "SYNTHESIZING..." : "INITIALIZE SYNTHESIS"}
                       </button>
                    </div>
                 </div>
              </div>
            </div>
 
            {/* Generated Output Surface */}
            <AnimatePresence>
               {generatedQuiz && (
                 <motion.div
                   initial={{ opacity: 0, y: 50 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="space-y-12"
                 >
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 px-8">
                      <div>
                         <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Diagnostic Manifest: <span className="text-indigo-600">{generatedQuiz.title}</span></h3>
                         <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Verification required before global deployment.</p>
                      </div>
                      <button 
                        onClick={handlePublish}
                        className="h-20 px-12 bg-emerald-600 text-white rounded-[2rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                      >
                        <Send className="w-6 h-6" />
                        DEPLOY TO CURRICULUM
                      </button>
                   </div>
 
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                      {generatedQuiz.questions.map((q: any, i: number) => (
                        <div key={i} className="group bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.06)] transition-all duration-700 relative overflow-hidden border-b-4 hover:border-b-indigo-600">
                           <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-indigo-600 group-hover:opacity-[0.08] transition-opacity">
                              <span className="text-8xl font-black italic tracking-tighter">{i + 1}</span>
                           </div>
                           <h4 className="text-[22px] font-black text-slate-900 mb-12 leading-snug pr-12">{q.question}</h4>
                           <div className="grid grid-cols-1 gap-4">
                              {q.options.map((opt: string, optIdx: number) => (
                                <div 
                                  key={optIdx} 
                                  className={cn(
                                    "p-6 rounded-2xl border-2 transition-all flex items-center justify-between group/opt",
                                    optIdx === q.correct_answer 
                                      ? "bg-emerald-50 border-emerald-500/30 shadow-md shadow-emerald-500/5" 
                                      : "bg-slate-50 border-transparent hover:border-slate-200"
                                  )}
                                >
                                   <div className="flex items-center gap-6">
                                      <span className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black transition-all",
                                        optIdx === q.correct_answer 
                                          ? "bg-emerald-600 text-white rotate-6" 
                                          : "bg-white text-slate-400 border border-slate-100 group-hover/opt:rotate-3"
                                      )}>
                                         {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className={cn(
                                        "text-[15px] font-bold leading-none",
                                        optIdx === q.correct_answer ? "text-emerald-700" : "text-slate-600"
                                      )}>{opt}</span>
                                   </div>
                                   {optIdx === q.correct_answer && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="inventory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-16"
          >
            {/* Inventory List Surface */}
            <div className="lg:col-span-8 space-y-10">
               <div className="flex items-center justify-between px-6">
                  <div className="space-y-1">
                     <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Diagnostic Inventory</h3>
                     <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Total available modules: {quizzes.length}</p>
                  </div>
                  <button 
                    onClick={loadInitialData}
                    className="h-12 px-6 rounded-xl text-indigo-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Synchronize Sector
                  </button>
               </div>
               
               {quizzes.length === 0 ? (
                 <div className="bg-white border border-dashed border-slate-200 rounded-[4rem] py-48 text-center m-4">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100 mx-auto">
                       <ClipboardCheck className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">REGISTRY VOID</h3>
                    <p className="text-[17px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed mb-12 italic opacity-80">
                      The diagnostic sector is currently inactive. Zero assessment modules identified in core registry.
                    </p>
                    <Button onClick={() => setShowGenerator(true)} className="h-16 px-12 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
                       INITIALIZE SYNTHESIS
                    </Button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-6 p-4">
                    {quizzes.map((quiz: any, index: number) => (
                      <motion.div
                        key={quiz._id}
                        initial={{ opacity: 0, x: -25 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.6 }}
                        className="group relative"
                      >
                        <div className="bg-white rounded-[3rem] border border-slate-100 p-8 pr-12 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex items-center justify-between cursor-default border-l-4 hover:border-l-indigo-600">
                           <div className="flex items-center gap-8">
                              <div className={cn(
                                "h-16 w-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-700 shadow-lg group-hover:rotate-6",
                                quiz.status === 'PUBLISHED' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                              )}>
                                 <BookOpen className="w-7 h-7" strokeWidth={2.5} />
                              </div>
                              <div className="space-y-1">
                                 <h4 className="text-[19px] font-black text-slate-900 tracking-tight leading-none uppercase group-hover:text-indigo-600 transition-colors truncate max-w-sm">{quiz.title}</h4>
                                 <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quiz.course_id?.title || 'Global Context'}</span>
                                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">{quiz.questions?.length || 0} Diagnostic Units</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-10">
                              <Badge className={cn(
                                "text-[9px] font-black px-4 py-1.5 rounded-full border-0 shadow-lg",
                                quiz.status === 'PUBLISHED' ? "bg-emerald-500 shadow-emerald-500/20 text-white" : "bg-slate-500 shadow-slate-500/20 text-white"
                              )}>
                                 {quiz.status}
                              </Badge>
                              <div className="flex items-center gap-3">
                                 <button className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm">
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                                 <button className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-white transition-all shadow-sm group-hover:rotate-45">
                                    <ArrowUpRight className="w-5 h-5" />
                                 </button>
                              </div>
                           </div>
                        </div>
                      </motion.div>
                    ))}
                 </div>
               )}
            </div>
 
            {/* Intelligence Side Surface */}
            <div className="lg:col-span-4 space-y-12">
               <div className="bg-[#0B0F1A] rounded-[3.5rem] p-12 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.2)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] group-hover:bg-indigo-600/30 transition-all duration-[2000ms]" />
                  <div className="relative z-10 space-y-10">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                           <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
                        </div>
                        <h4 className="text-[20px] font-black text-white tracking-tight">AI Diagnostic Link</h4>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="p-7 rounded-[2.2rem] bg-white/5 border border-white/5 backdrop-blur-xl">
                           <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-3">Efficiency Optimization</p>
                           <p className="text-[15px] text-white/90 font-bold leading-[1.6]">Zero latency content drafting. AI synthesizes context-aware diagnostic modules in real-time pulses.</p>
                        </div>
                        <div className="p-7 rounded-[2.2rem] bg-indigo-500/10 border border-white/5 backdrop-blur-xl">
                           <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-3">Operational Protocol</p>
                           <p className="text-[15px] text-white/90 font-bold leading-[1.6]">Authoritative preview required before curriculum injection. Deploy modules with one tap.</p>
                        </div>
                     </div>
 
                     <button 
                        onClick={() => setShowGenerator(true)}
                        className="w-full h-20 bg-white text-indigo-600 rounded-[2rem] text-[14px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        <Zap className="h-5 w-5 fill-indigo-600" />
                        ACTIVATE NEURAL GEN
                     </button>
                  </div>
               </div>
 
               <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-10">
                  <div className="space-y-2">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Master Grid Stats</h4>
                     <p className="text-[13px] font-bold text-slate-400 italic opacity-60">// Real-time registry metrics.</p>
                  </div>
                  
                  <div className="space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <Layers className="w-5 h-5" />
                           </div>
                           <span className="text-[15px] font-bold text-slate-600">Total Units</span>
                        </div>
                        <span className="text-[28px] font-black text-slate-900 tracking-tighter">{quizzes.length}</span>
                     </div>
                     <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <ShieldCheck className="w-5 h-5" />
                           </div>
                           <span className="text-[15px] font-bold text-slate-600">Active Streams</span>
                        </div>
                        <span className="text-[28px] font-black text-emerald-600 tracking-tighter">{quizzes.filter(q => q.status === 'PUBLISHED').length}</span>
                     </div>
                     <div className="flex items-center gap-4 text-slate-300">
                        <FileText className="w-5 h-5 opacity-40" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Diagnostic health sync: 100%</p>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
 
export default function InstructorQuizPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="relative">
                  <div className="h-20 w-20 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                   <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em]">Synchronizing Assessment Hub</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Establishing neural link...</p>
                </div>
            </div>
        }>
            <QuizContent />
        </Suspense>
    )
}
 
function MetricMiniCard({ label, value, icon, variant = "default" }: any) {
  return (
    <div className={cn(
      "p-6 rounded-[2.5rem] border flex items-center gap-5 transition-all cursor-default group",
      variant === "glass" 
        ? "bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md" 
        : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-lg"
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
            variant === "glass" ? "text-indigo-200" : "text-slate-400"
          )}>{label}</p>
          <p className={cn(
            "text-[24px] font-black leading-none tracking-tighter",
            variant === "glass" ? "text-white" : "text-slate-900"
          )}>{value}</p>
       </div>
    </div>
  )
}
