"use client"

import React, { useState, useEffect, use } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  BookOpen, Plus, Edit, Trash2, GripVertical, Video,
  FileText, CheckCircle, Eye, ArrowLeft, Save, Sparkles,
  CheckCircle2, Target, Layout, Database, ChevronLeft,
  ChevronDown, Settings2, Globe, ShieldCheck, Activity,
  ArrowUpRight
} from "lucide-react"
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { cn } from "../../../../lib/utils"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell
} from "../../../../components/platform/ui-standard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../../components/ui/accordion'
import { useAuth } from '../../../../lib/auth-context'
import { instructorApi } from '../../../../lib/api'
import { toast } from "sonner"
import { API_URL } from '../../../../lib/config'

interface Lesson {
  _id: string
  title: string
  description?: string
  type: "video" | "text" | "pdf" | "quiz"
  content?: string
  duration?: number
  order: number
  isPreview: boolean
}

interface Module {
  _id: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
}

interface Course {
  _id: string
  title: string
  description: string
  status: string
  category: string
  level: string
  course_credits?: number
  subject_id?: { name: string, code: string }
  semester_id?: { name: string, number: number }
  department_id?: { name: string, code: string }
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { token } = useAuth()
  const courseId = unwrappedParams.id

  // Get token directly from storage as fallback
  const getToken = () => {
    if (token) return token
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
    }
    return null
  }

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  // Module dialog
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleData, setModuleData] = useState({ title: "", description: "" })

  // Lesson dialog
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    type: "video" as "video" | "text" | "pdf" | "quiz",
    content: "",
    duration: 0,
    isPreview: false
  })

  // AI Quiz Dialolg
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiGenerating, setAIGenerating] = useState(false)
  const [aiModuleId, setAIModuleId] = useState("")
  const [aiDifficulty, setAIDifficulty] = useState("medium")
  const [aiQuizTitle, setAIQuizTitle] = useState("")

  useEffect(() => {
    loadCourseData()
  }, [courseId, token])

  async function loadCourseData() {
    if (!token || !courseId) return
    setLoading(true)
    try {
      const res = await instructorApi.getCourse(token, courseId)
      if (res.success && res.data) {
        const data = res.data as { course: Course; modules: Module[] }
        setCourse(data.course)
        setModules(data.modules || [])
      }
    } catch (error) {
      toast.error("Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  async function handlePublishCourse() {
    const authToken = getToken()
    if (!authToken || !courseId) return

    if (!confirm("Publish this course? Students in your organization will be able to see and enroll in it.")) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/instructor/courses/${courseId}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Course published successfully!")
        loadCourseData() // Reload to update status
      } else {
        toast.error(data.message || "Failed to publish course")
      }
    } catch (error) {
      console.error('Publish course error:', error)
      toast.error("Failed to publish course")
    }
  }

  async function handleCreateModule() {
    if (!token || !courseId || !moduleData.title) {
      toast.error("Module title is required")
      return
    }

    try {
      const res = await instructorApi.createModule(token!, courseId as string, {
        ...moduleData,
        order: modules.length + 1
      })
      if (res.success) {
        toast.success("Module created successfully")
        setIsModuleDialogOpen(false)
        setModuleData({ title: "", description: "" })
        loadCourseData()
      } else {
        toast.error(res.error || "Failed to create module")
      }
    } catch (error) {
      toast.error("Failed to create module")
    }
  }

  async function handleUpdateModule() {
    if (!token || !editingModule || !moduleData.title) {
      toast.error("Module title is required")
      return
    }

    try {
      const res = await instructorApi.updateModule(token!, editingModule._id, moduleData)
      if (res.success) {
        toast.success("Module updated successfully")
        setIsModuleDialogOpen(false)
        setEditingModule(null)
        setModuleData({ title: "", description: "" })
        loadCourseData()
      } else {
        toast.error(res.error || "Failed to update module")
      }
    } catch (error) {
      toast.error("Failed to update module")
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!token || !confirm("Delete this module and all its lessons?")) return

    try {
      const res = await instructorApi.deleteModule(token, moduleId)
      if (res.success) {
        toast.success("Module deleted successfully")
        loadCourseData()
      } else {
        toast.error(res.error || "Failed to delete module")
      }
    } catch (error) {
      toast.error("Failed to delete module")
    }
  }

  async function handleCreateLesson() {
    const authToken = getToken()
    if (!authToken || !selectedModuleId || !lessonData.title) {
      toast.error("Lesson title is required")
      return
    }

    try {
      const module = modules.find(m => m._id === selectedModuleId)
      let contentData: any = { videoUrl: lessonData.content }

      const res = await instructorApi.createLesson(token!, selectedModuleId!, {
        title: lessonData.title,
        description: lessonData.description,
        type: lessonData.type,
        content: contentData,
        order: (module?.lessons.length || 0) + 1,
        duration: lessonData.duration,
        isPreview: lessonData.isPreview
      })

      if (res.success) {
        toast.success("Lesson created successfully")
        setIsLessonDialogOpen(false)
        setLessonData({
          title: "",
          description: "",
          type: "video",
          content: "",
          duration: 0,
          isPreview: false
        })
        loadCourseData()
      } else {
        toast.error(res.error || "Failed to create lesson")
      }
    } catch (error) {
      toast.error("Failed to create lesson")
    }
  }

  async function handleUpdateLesson() {
    if (!token || !editingLesson || !lessonData.title) {
      toast.error("Lesson title is required")
      return
    }

    try {
      const res = await instructorApi.updateLesson(token!, editingLesson._id, lessonData)
      if (res.success) {
        toast.success("Lesson updated successfully")
        setIsLessonDialogOpen(false)
        setEditingLesson(null)
        setLessonData({
          title: "",
          description: "",
          type: "video",
          content: "",
          duration: 0,
          isPreview: false
        })
        loadCourseData()
      } else {
        toast.error(res.error || "Failed to update lesson")
      }
    } catch (error) {
      toast.error("Failed to update lesson")
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!token || !confirm("Delete this lesson?")) return

    try {
      const res = await instructorApi.deleteLesson(token, lessonId)
      if (res.success) {
        toast.success("Lesson deleted successfully")
        loadCourseData()
      } else {
        toast.error(res.error || "Failed to delete lesson")
      }
    } catch (error) {
      toast.error("Failed to delete lesson")
    }
  }

  function openModuleDialog(module?: Module) {
    if (module) {
      setEditingModule(module)
      setModuleData({ title: module.title, description: module.description || "" })
    } else {
      setEditingModule(null)
      setModuleData({ title: "", description: "" })
    }
    setIsModuleDialogOpen(true)
  }

  function openLessonDialog(moduleId: string, lesson?: Lesson) {
    setSelectedModuleId(moduleId)
    if (lesson) {
      setEditingLesson(lesson)
      setLessonData({
        title: lesson.title,
        description: lesson.description || "",
        type: lesson.type,
        content: lesson.content || "",
        duration: lesson.duration || 0,
        isPreview: lesson.isPreview
      })
    } else {
      setEditingLesson(null)
      setLessonData({
        title: "",
        description: "",
        type: "video",
        content: "",
        duration: 0,
        isPreview: false
      })
    }
    setIsLessonDialogOpen(true)
  }

  async function handleGenerateAIQuiz() {
    if (!token || !courseId || !aiModuleId) {
      toast.error("Please select a module")
      return
    }

    setAIGenerating(true)
    try {
      const selectedModule = modules.find(m => m._id === aiModuleId)
      const topic = selectedModule ? selectedModule.title : "General"

      const res = await instructorApi.generateAIQuiz(token!, {
        course_id: courseId as string,
        topic: topic,
        num_questions: 10,
        difficulty: aiDifficulty
      })

      if (res.success) {
        toast.success("AI Synthesis Complete: Instructional Assessment Matrix Generated")
        setShowAIDialog(false)
        loadCourseData()
      } else {
        toast.error(res.error || "Synthesis Failure")
      }
    } catch (error) {
      toast.error("Critical Neural Link Failure")
    } finally {
      setAIGenerating(false)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />
      case "text": return <FileText className="h-4 w-4" />
      case "pdf": return <FileText className="h-4 w-4" />
      case "quiz": return <CheckCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const handleSaveModule = editingModule ? handleUpdateModule : handleCreateModule;
  const handleSaveLesson = editingLesson ? handleUpdateLesson : handleCreateLesson;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-medium">Course not found</p>
          <Button onClick={() => router.push("/instructor/courses")} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-32 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[3rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3rem] bg-white border border-slate-200/60 p-12 lg:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.push("/instructor/courses")}
                className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all flex items-center justify-center shadow-sm group/back"
              >
                <ArrowLeft className="h-6 w-6 stroke-[3] group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-[-0.04em] leading-tight max-w-xl">
                    {course.title}
                  </h1>
                  {course.status === 'draft' ? (
                    <span className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 rounded-full shadow-sm">Draft Registry</span>
                  ) : (
                    <span className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full shadow-sm">Active Hub</span>
                  )}
                </div>
                <p className="text-[15px] font-bold text-slate-400 tracking-tight leading-none italic opacity-80">
                  Orchestrate your instructional assets and architectural modules.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {course.status === 'draft' && (
                <Button
                  onClick={handlePublishCourse}
                  className="h-16 px-10 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                  Deploy Curriculum
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowAIDialog(true)} 
                className="h-16 px-10 rounded-2xl border-indigo-100 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest gap-3 hover:bg-indigo-100 transition-all shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-indigo-400 stroke-[3]" />
                Neural Quiz
              </Button>
              <Button 
                onClick={() => openModuleDialog()} 
                className="h-16 px-10 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                Initialize Module
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Architecture Specs */}
      {course.course_credits !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <SpecCard 
            label="Academic Domain" 
            title={course.subject_id?.name || 'N/A'} 
            sub={course.subject_id?.code || 'UNSPECIFIED'} 
            icon={<BookOpen />} 
            color="indigo" 
          />
          <SpecCard 
            label="Credit Weight" 
            title={`${course.course_credits} Units`} 
            sub="Academic Scale" 
            icon={<Target />} 
            color="emerald" 
          />
          <SpecCard 
            label="Instructional Tier" 
            title={course.semester_id?.name || 'N/A'} 
            sub={`Tier ${course.semester_id?.number || '0'}`} 
            icon={<Layout />} 
            color="purple" 
          />
          <SpecCard 
            label="Departmental Node" 
            title={course.department_id?.name || 'N/A'} 
            sub={course.department_id?.code || 'EXTERNAL'} 
            icon={<Database />} 
            color="rose" 
          />
        </div>
      )}

      {/* Modules & Lessons */}
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/30 space-y-8">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center border border-slate-100 shadow-sm text-slate-300">
            <BookOpen className="h-10 w-10" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-black text-slate-900 tracking-tight uppercase">Empty Curriculum Hub</p>
            <p className="text-[13px] font-bold text-slate-400 italic opacity-70">Initialize your first module to begin asset orchestration.</p>
          </div>
          <Button onClick={() => openModuleDialog()} className="h-16 px-10 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
            <Plus className="h-4 w-4 stroke-[3]" />
            Initialize Module
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
           <div className="flex items-center justify-between px-4">
              <div className="space-y-1">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Structural Blocks</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Modular Curriculum Organization</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="px-6 py-2 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <Activity className="w-4 h-4" />
                    {modules.length} Modules Synthetic
                 </div>
              </div>
           </div>

           <Accordion type="multiple" className="space-y-6">
             {modules.map((module, index) => (
               <AccordionItem
                 key={module._id}
                 value={module._id}
                 className="rounded-[2.5rem] border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/20 transition-all duration-500 group/module"
               >
                 <AccordionTrigger className="px-10 py-8 hover:no-underline hover:bg-slate-50/50 transition-all border-none">
                   <div className="flex items-center gap-8 flex-1">
                     <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover/module:text-indigo-400 transition-colors shadow-sm">
                          <GripVertical className="h-5 w-5 stroke-[2.5]" />
                       </div>
                       <div className="flex flex-col items-start leading-none gap-1.5">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                             Block {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover/module:text-indigo-600 transition-colors">{module.title}</h3>
                       </div>
                     </div>
                     
                     <div className="flex-1 hidden md:block">
                        {module.description && (
                          <p className="text-sm font-bold text-slate-400 italic opacity-80 text-left line-clamp-1">
                            {module.description}
                          </p>
                        )}
                     </div>

                     <div className="flex items-center gap-4">
                       <SimpleBadge variant="gray" className="h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-slate-50 border-slate-100 text-slate-400 rounded-full">
                         {module.lessons.length} Assets
                       </SimpleBadge>
                       <div className="flex items-center gap-1 opacity-0 group-hover/module:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openModuleDialog(module); }}
                            className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                          >
                            <Edit className="h-4 w-4 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteModule(module._id); }}
                            className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                          >
                            <Trash2 className="h-4 w-4 stroke-[2.5]" />
                          </button>
                       </div>
                     </div>
                   </div>
                 </AccordionTrigger>
                 <AccordionContent className="px-10 pb-10 pt-4">
                   <div className="space-y-3">
                     <div className="h-px bg-slate-50 mb-8" />
                     {module.lessons.length === 0 ? (
                       <div className="text-center py-16 border-2 border-dashed border-slate-50 rounded-[2rem] bg-slate-50/20 space-y-6">
                         <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center mx-auto text-slate-200">
                           <Layout className="h-8 w-8" />
                         </div>
                         <div className="space-y-1">
                            <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">Empty Module Container</p>
                            <p className="text-[11px] font-bold text-slate-300 italic opacity-40">No instructional assets have been injected yet.</p>
                         </div>
                         <Button
                           onClick={() => openLessonDialog(module._id)}
                           className="h-12 px-8 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 shadow-sm transition-all"
                         >
                           <Plus className="h-3.5 w-3.5 stroke-[3]" />
                           Inject Asset
                         </Button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         {module.lessons.map((lesson, lessonIndex) => (
                           <div
                             key={lesson._id}
                             className="flex items-center gap-6 p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group/lesson"
                           >
                             <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover/lesson:text-indigo-400 transition-colors">
                                <GripVertical className="h-4 w-4 stroke-[3]" />
                             </div>
                             
                             <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover/lesson:scale-110 transition-transform">
                               {getLessonIcon(lesson.type)}
                             </div>

                             <div className="flex-1 space-y-1">
                               <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest tabular-nums">Asset {String(lessonIndex + 1).padStart(2, '0')}</span>
                                 <span className="h-1 w-1 rounded-full bg-slate-200" />
                                 <span className="font-black text-slate-900 tracking-tight">{lesson.title}</span>
                                 {lesson.isPreview && (
                                   <div className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                                      Public Preview
                                   </div>
                                 )}
                               </div>
                               {lesson.description && (
                                 <p className="text-xs font-bold text-slate-400 italic opacity-80 line-clamp-1">
                                   {lesson.description}
                                 </p>
                               )}
                             </div>

                             {lesson.duration && (
                               <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-500 tabular-nums">
                                 {lesson.duration} MIN
                               </div>
                             )}

                             <div className="flex items-center gap-2 pr-2">
                               <button
                                 onClick={() => openLessonDialog(module._id, lesson)}
                                 className="h-10 w-10 rounded-xl bg-white border border-slate-50 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm"
                               >
                                 <Edit className="h-4 w-4 stroke-[2.5]" />
                               </button>
                               <button
                                 onClick={() => handleDeleteLesson(lesson._id)}
                                 className="h-10 w-10 rounded-xl bg-white border border-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
                               >
                                 <Trash2 className="h-4 w-4 stroke-[2.5]" />
                               </button>
                             </div>
                           </div>
                         ))}
                         
                         <div className="pt-4">
                            <button
                              onClick={() => openLessonDialog(module._id)}
                              className="w-full h-16 rounded-[1.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 flex items-center justify-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all group/add"
                            >
                              <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover/add:rotate-90 transition-transform">
                                 <Plus className="h-4 w-4 stroke-[3]" />
                              </div>
                              Inject Source Asset
                            </button>
                         </div>
                       </div>
                     )}
                   </div>
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
        </div>
      )}

      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)]">
          <div className="bg-slate-900 p-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
             <DialogHeader className="relative z-10">
               <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                     <Layout className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                     <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">
                       {editingModule ? 'Register Structural Block' : 'Initialize Block Node'}
                     </DialogTitle>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic leading-none">Primary Curriculum Architecture Metadata</p>
                  </div>
               </div>
             </DialogHeader>
          </div>
          
          <div className="p-10 space-y-8 bg-white">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Block Designation</Label>
                <Input
                  placeholder="e.g., Advanced Neural Architectures"
                  className="h-16 px-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-[15px] font-bold"
                  value={moduleData.title}
                  onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Contextual Description</Label>
                <Textarea
                  placeholder="Elaborate on the module's instructional objectives..."
                  className="min-h-[140px] p-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-[15px] font-medium resize-none"
                  value={moduleData.description}
                  onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsModuleDialogOpen(false)}
                className="h-14 px-8 rounded-xl border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest"
              >
                Abort
              </Button>
              <Button 
                onClick={handleSaveModule}
                className="h-14 px-10 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {editingModule ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingModule ? 'Commit Changes' : 'Initialize Block'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)]">
           <div className="bg-indigo-600 p-10 relative overflow-hidden">
             <div className="absolute bottom-0 right-0 -mr-24 -mb-24 w-80 h-80 bg-white/10 rounded-full blur-3xl rotate-12" />
             <DialogHeader className="relative z-10">
               <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                     <Layout className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                     <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">
                        {editingLesson ? 'Synchronize Instructional Asset' : 'Inject Asset Linkage'}
                     </DialogTitle>
                     <p className="text-[10px] font-black text-white/50 uppercase tracking-widest italic leading-none">Source Parameters and Integration Logic</p>
                  </div>
               </div>
             </DialogHeader>
          </div>

          <div className="p-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3 col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Asset Nomenclature</Label>
                <Input
                  placeholder="e.g., Theoretical Foundations of Learning"
                  className="h-16 px-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all text-[15px] font-bold"
                  value={lessonData.title}
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Asset Modality</Label>
                <Select
                  value={lessonData.type}
                  onValueChange={(value: any) => setLessonData({ ...lessonData, type: value })}
                >
                  <SelectTrigger className="h-16 px-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all text-[13px] font-black uppercase tracking-widest">
                    <SelectValue placeholder="Select Modality" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-xl">
                    <SelectItem value="video" className="rounded-xl py-3 focus:bg-indigo-50 focus:text-indigo-600 text-xs font-black uppercase tracking-widest">VIDEO SOURCE</SelectItem>
                    <SelectItem value="text" className="rounded-xl py-3 focus:bg-indigo-50 focus:text-indigo-600 text-xs font-black uppercase tracking-widest">TEXTUAL DOC</SelectItem>
                    <SelectItem value="pdf" className="rounded-xl py-3 focus:bg-indigo-50 focus:text-indigo-600 text-xs font-black uppercase tracking-widest">PDF RESOURCE</SelectItem>
                    <SelectItem value="quiz" className="rounded-xl py-3 focus:bg-indigo-50 focus:text-indigo-600 text-xs font-black uppercase tracking-widest">ASSESSMENT HUB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Temporal Duration (MIN)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-16 px-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all text-[15px] font-bold tabular-nums"
                  value={lessonData.duration}
                  onChange={(e) => setLessonData({ ...lessonData, duration: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-3 col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Structural Content / Source Link</Label>
                <Textarea
                  placeholder="Inject video URL, Markdown content, or structural parameters..."
                  className="min-h-[120px] p-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all text-[14px] font-medium resize-none tabular-nums"
                  value={lessonData.content}
                  onChange={(e) => setLessonData({ ...lessonData, content: e.target.value })}
                />
              </div>

              <div className="col-span-2 py-4">
                 <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                    <div className="space-y-1">
                       <p className="text-[13px] font-black text-slate-900 tracking-tight uppercase">Public Access Node</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60 leading-none">Allow scholarship without prior session registry</p>
                    </div>
                    <button
                      onClick={() => setLessonData({ ...lessonData, isPreview: !lessonData.isPreview })}
                      className={cn(
                        "h-10 w-20 rounded-full p-1 transition-all duration-500 relative shadow-inner overflow-hidden",
                        lessonData.isPreview ? "bg-indigo-600 shadow-indigo-200" : "bg-slate-200 shadow-slate-300"
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-full bg-white shadow-lg transition-transform duration-500",
                        lessonData.isPreview ? "translate-x-10" : "translate-x-0"
                      )} />
                    </button>
                 </div>
              </div>
            </div>
          </div>

          <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setIsLessonDialogOpen(false)}
                className="h-14 px-8 rounded-xl border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest"
              >
                Retract
              </Button>
              <Button 
                onClick={handleSaveLesson}
                className="h-14 px-10 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                {editingLesson ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingLesson ? 'Synchronize Asset' : 'Inject Asset'}
              </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Quiz Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
         <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)]">
            <div className="bg-slate-900 p-10 relative overflow-hidden">
               <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
               <DialogHeader className="relative z-10">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/40">
                       <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                       <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">Neural Synthesis Hub</DialogTitle>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic leading-none">Generative Assessment Matrix Architecture</p>
                    </div>
                 </div>
               </DialogHeader>
            </div>

            <div className="p-10 space-y-8 bg-white">
               <div className="space-y-6">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Source Module Node</Label>
                    <Select value={aiModuleId} onValueChange={setAIModuleId}>
                      <SelectTrigger className="h-16 px-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all text-[13px] font-black uppercase tracking-widest">
                        <SelectValue placeholder="Select Module" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-xl">
                        {modules.map(m => (
                          <SelectItem key={m._id} value={m._id} className="rounded-xl py-3 focus:bg-indigo-50 focus:text-indigo-600 text-xs font-black uppercase tracking-widest">
                            {m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Cognitive Complexity</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['easy', 'medium', 'hard'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setAIDifficulty(level)}
                          className={cn(
                            "h-14 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                            aiDifficulty === level 
                              ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                              : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Resultant Nomenclature</Label>
                    <Input
                      placeholder="e.g., Synthetic Assessment - Phase 01"
                      className="h-16 px-6 rounded-2xl bg-slate-50 border-slate-100 focus:border-indigo-500 transition-all text-[15px] font-bold"
                      value={aiQuizTitle}
                      onChange={(e) => setAIQuizTitle(e.target.value)}
                    />
                 </div>
               </div>

               <DialogFooter className="pt-4">
                 <Button 
                   variant="outline" 
                   onClick={() => setShowAIDialog(false)}
                   className="h-14 px-8 rounded-xl border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest"
                 >
                   Abort
                 </Button>
                 <Button 
                   onClick={handleGenerateAIQuiz}
                   disabled={aiGenerating}
                   className="h-14 px-10 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {aiGenerating ? (
                     <>
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Synthesizing...
                     </>
                   ) : (
                     <>
                        <Sparkles className="h-4 w-4" />
                        Execute Synthesis
                     </>
                   )}
                 </Button>
               </DialogFooter>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  )
}

function SpecCard({ label, title, sub, icon, color }: any) {
  const colors: any = {
    indigo: "from-indigo-500/10 to-blue-500/10 border-indigo-500/20 text-indigo-600",
    emerald: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600",
    purple: "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600",
    rose: "from-rose-500/10 to-orange-500/10 border-rose-500/20 text-rose-600"
  }

  return (
    <div className={cn("p-8 rounded-[2.5rem] bg-gradient-to-br border shadow-xl shadow-slate-200/20 relative overflow-hidden group/spec transition-all duration-500 hover:scale-[1.02]", colors[color])}>
      <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover/spec:rotate-12 group-hover/spec:scale-125 transition-transform duration-1000">
        {React.cloneElement(icon, { size: 48, strokeWidth: 2.5 })}
      </div>
      <div className="relative z-10 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 leading-none">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{title}</p>
        <div className="flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-current opacity-40 animate-pulse" />
           <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">{sub}</p>
        </div>
      </div>
    </div>
  )
}
