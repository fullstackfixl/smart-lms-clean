"use client"

import React, { useState, useEffect, use, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen, Plus, Edit, Trash2, Video, FileText, CheckCircle,
  ArrowLeft, Sparkles, GripVertical, RefreshCw, Upload, X, Loader2, File, Play
} from "lucide-react"
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Textarea } from '../../../../components/ui/textarea'
import { Progress } from '../../../../components/ui/progress'
import { cn } from "../../../../lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { API_URL } from '../../../../lib/config'
import { toast } from "sonner"

interface Lesson {
  _id: string
  title: string
  description?: string
  type: "video" | "text" | "pdf" | "quiz"
  content?: string | { videoUrl?: string; pdfUrl?: string; textContent?: string }
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
  price: number
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { token } = useAuth()
  const courseId = unwrappedParams.id

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleData, setModuleData] = useState({ title: "", description: "" })

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

  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiGenerating, setAIGenerating] = useState(false)
  const [aiModuleId, setAIModuleId] = useState("")
  const [aiDifficulty, setAIDifficulty] = useState("medium")

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFileUrl, setUploadedFileUrl] = useState("")
  const uploadedUrlRef = useRef("")
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (token && courseId) loadCourseData()
  }, [courseId, token])

  async function loadCourseData() {
    if (!token || !courseId) return
    setLoading(true)
    try {
      const res = await instructorApi.getCourse(token, courseId)
      if (res.success && res.data) {
        const data = res.data as any
        setCourse(data.course)
        setModules(data.modules || [])
      } else {
        toast.error("Failed to load course")
      }
    } catch (error) {
      toast.error("Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  const uploadToCloudinary = useCallback(async (file: File, type: 'video' | 'pdf') => {
    if (!token) return null
    setUploading(true)
    setUploadProgress(0)
    try {
      const sigRes = await fetch(`${API_URL}/api/upload/signature?type=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const sigData = await sigRes.json()
      if (!sigData.success) throw new Error("Failed to get upload signature")

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sigData.data.apiKey)
      formData.append('timestamp', sigData.data.timestamp)
      formData.append('signature', sigData.data.signature)
      formData.append('folder', sigData.data.folder)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.data.cloudName}/${type === 'video' ? 'video' : 'raw'}/upload`,
        { method: 'POST', body: formData }
      )
      clearInterval(progressInterval)
      const uploadData = await uploadRes.json()

      if (uploadData.secure_url) {
        setUploadProgress(100)
        setUploadedFileUrl(uploadData.secure_url)
        uploadedUrlRef.current = uploadData.secure_url  // Set ref synchronously
        setLessonData(prev => ({ ...prev, content: uploadData.secure_url }))
        toast.success(`${type === 'video' ? 'Video' : 'PDF'} uploaded successfully`)
        return uploadData.secure_url
      }
      throw new Error("Upload failed")
    } catch (error) {
      toast.error(`Failed to upload ${type}`)
      return null
    } finally {
      setUploading(false)
    }
  }, [token])

  const handleDrop = useCallback((e: React.DragEvent, type: 'video' | 'pdf') => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error("Please upload a video file")
      return
    }
    if (type === 'pdf' && file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file")
      return
    }
    uploadToCloudinary(file, type)
  }, [uploadToCloudinary])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'pdf') => {
    const file = e.target.files?.[0]
    if (file) uploadToCloudinary(file, type)
  }, [uploadToCloudinary])

  async function handleSubmitForApproval() {
    if (!token || !courseId) return
    if (!confirm("Submit this course for approval? Your organization admin will review it before publishing.")) return
    try {
      const res = await fetch(`${API_URL}/instructor/courses/${courseId}/submit-for-approval`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Course submitted for approval")
        loadCourseData()
      } else {
        toast.error(data.error || "Failed to submit")
      }
    } catch (error) {
      toast.error("Failed to submit for approval")
    }
  }

  async function handleCreateModule() {
    if (!token || !courseId || !moduleData.title) {
      toast.error("Module title is required")
      return
    }
    try {
      const res = await instructorApi.createModule(token, courseId, { ...moduleData, order: modules.length + 1 })
      if (res.success) {
        toast.success("Module created")
        setIsModuleDialogOpen(false)
        setModuleData({ title: "", description: "" })
        loadCourseData()
      }
    } catch (error) {
      toast.error("Failed to create module")
    }
  }

  async function handleUpdateModule() {
    if (!token || !editingModule || !moduleData.title) return
    try {
      const res = await instructorApi.updateModule(token, editingModule._id, moduleData)
      if (res.success) {
        toast.success("Module updated")
        setIsModuleDialogOpen(false)
        setEditingModule(null)
        setModuleData({ title: "", description: "" })
        loadCourseData()
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
        toast.success("Module deleted")
        loadCourseData()
      }
    } catch (error) {
      toast.error("Failed to delete module")
    }
  }

  async function handleCreateLesson() {
    if (!token || !selectedModuleId || !lessonData.title) {
      toast.error("Lesson title is required")
      return
    }
    // For video/pdf lessons, ensure content (URL) is set - use ref for synchronous access
    const contentUrl = lessonData.content || uploadedUrlRef.current || ""
    if ((lessonData.type === 'video' || lessonData.type === 'pdf') && !contentUrl) {
      toast.error("Please upload a file first")
      return
    }
    try {
      const module = modules.find(m => m._id === selectedModuleId)
      // Format content based on lesson type
      let content: any = {}
      if (lessonData.type === 'video') {
        content = { videoUrl: contentUrl }
      } else if (lessonData.type === 'pdf') {
        content = { pdfUrl: contentUrl }
      } else if (lessonData.type === 'text') {
        content = { textContent: lessonData.content }
      } else if (lessonData.type === 'quiz') {
        content = { quizId: lessonData.content }
      }
      const res = await instructorApi.createLesson(token, selectedModuleId, {
        ...lessonData,
        content,
        order: (module?.lessons.length || 0) + 1
      })
      if (res.success) {
        toast.success("Lesson created")
        setIsLessonDialogOpen(false)
        resetLessonForm()
        loadCourseData()
      }
    } catch (error) {
      toast.error("Failed to create lesson")
    }
  }

  async function handleUpdateLesson() {
    if (!token || !editingLesson || !lessonData.title) return
    try {
      const contentUrl = lessonData.content || uploadedUrlRef.current || ""
      let content: any = {}
      if (lessonData.type === 'video') {
        content = { videoUrl: contentUrl }
      } else if (lessonData.type === 'pdf') {
        content = { pdfUrl: contentUrl }
      } else if (lessonData.type === 'text') {
        content = { textContent: lessonData.content }
      } else if (lessonData.type === 'quiz') {
        content = { quizId: lessonData.content }
      }
      const res = await instructorApi.updateLesson(token, editingLesson._id, {
        ...lessonData,
        content
      })
      if (res.success) {
        toast.success("Lesson updated")
        setIsLessonDialogOpen(false)
        resetLessonForm()
        loadCourseData()
      }
    } catch (error) {
      toast.error("Failed to update lesson")
    }
  }

  function resetLessonForm() {
    setEditingLesson(null)
    setLessonData({ title: "", description: "", type: "video", content: "", duration: 0, isPreview: false })
    setUploadedFileUrl("")
    uploadedUrlRef.current = ""  // Reset ref
    setUploadProgress(0)
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!token || !confirm("Delete this lesson?")) return
    try {
      const res = await instructorApi.deleteLesson(token, lessonId)
      if (res.success) {
        toast.success("Lesson deleted")
        loadCourseData()
      }
    } catch (error) {
      toast.error("Failed to delete lesson")
    }
  }

  async function handleGenerateAIQuiz() {
    if (!token || !courseId || !aiModuleId) {
      toast.error("Please select a module")
      return
    }
    setAIGenerating(true)
    try {
      const selectedModule = modules.find(m => m._id === aiModuleId)
      const res = await instructorApi.generateAIQuiz(token, {
        course_id: courseId,
        topic: selectedModule?.title || "General",
        num_questions: 10,
        difficulty: aiDifficulty
      })
      if (res.success) {
        toast.success("AI Quiz generated successfully")
        setShowAIDialog(false)
        loadCourseData()
      }
    } catch (error) {
      toast.error("Failed to generate AI quiz")
    } finally {
      setAIGenerating(false)
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
    setUploadedFileUrl("")
    uploadedUrlRef.current = ""  // Reset ref
    setUploadProgress(0)
    if (lesson) {
      setEditingLesson(lesson)
      // Extract content string from object if needed
      let contentStr = ""
      if (lesson.content) {
        if (typeof lesson.content === 'string') {
          contentStr = lesson.content
        } else if ('videoUrl' in lesson.content) {
          contentStr = lesson.content.videoUrl || ""
        } else if ('pdfUrl' in lesson.content) {
          contentStr = lesson.content.pdfUrl || ""
        } else if ('textContent' in lesson.content) {
          contentStr = lesson.content.textContent || ""
        }
      }
      setLessonData({
        title: lesson.title,
        description: lesson.description || "",
        type: lesson.type,
        content: contentStr,
        duration: lesson.duration || 0,
        isPreview: lesson.isPreview
      })
      if (contentStr && (lesson.type === 'video' || lesson.type === 'pdf')) {
        setUploadedFileUrl(contentStr)
        uploadedUrlRef.current = contentStr  // Set ref for editing
      }
    } else {
      setEditingLesson(null)
      setLessonData({ title: "", description: "", type: "video", content: "", duration: 0, isPreview: false })
    }
    setIsLessonDialogOpen(true)
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />
      case "quiz": return <CheckCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg font-medium text-slate-900">Course not found</p>
        <Button onClick={() => router.push("/instructor/courses")} className="mt-4">
          Back to Courses
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/instructor/courses")} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
              <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                course.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-green-100 text-green-700 border-green-200'
              )}>
                {course.status}
              </span>
            </div>
            <p className="text-slate-500">{course.category} • {course.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadCourseData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {course.status === 'draft' && (
            <Button onClick={handleSubmitForApproval} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          )}
          <Button onClick={() => setShowAIDialog(true)} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Quiz
          </Button>
          <Button onClick={() => openModuleDialog()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Modules</p>
          <p className="text-2xl font-bold text-slate-900">{modules.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Lessons</p>
          <p className="text-2xl font-bold text-slate-900">{modules.reduce((acc, m) => acc + m.lessons.length, 0)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Price</p>
          <p className="text-2xl font-bold text-slate-900">${course.price}</p>
        </div>
      </div>

      {/* Modules & Lessons */}
      {modules.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-900 font-medium mb-2">No modules yet</p>
          <p className="text-slate-500 mb-4">Add your first module to start building your course</p>
          <Button onClick={() => openModuleDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Module
          </Button>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {modules.map((module, index) => (
            <AccordionItem key={module._id} value={module._id} className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Module {index + 1}</span>
                  <span className="font-medium text-slate-900">{module.title}</span>
                  <span className="ml-auto text-xs text-slate-500">{module.lessons.length} lessons</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  {module.lessons.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">No lessons in this module</p>
                  ) : (
                    module.lessons.map((lesson) => (
                      <div key={lesson._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                          {getLessonIcon(lesson.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{lesson.title}</p>
                          {lesson.duration && <p className="text-xs text-slate-500">{lesson.duration} min</p>}
                        </div>
                        {lesson.isPreview && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Preview</span>}
                        {lesson.content && typeof lesson.content === 'object' && 'videoUrl' in lesson.content && lesson.content.videoUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-blue-600"
                            onClick={() => setPreviewVideoUrl(lesson.content && typeof lesson.content === 'object' ? lesson.content.videoUrl || null : null)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openLessonDialog(module._id, lesson)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteLesson(lesson._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                  <Button variant="outline" className="w-full mt-2" onClick={() => openLessonDialog(module._id)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson
                  </Button>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openModuleDialog(module)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Module
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteModule(module._id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Module Dialog */}
      <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Module Title</Label>
              <Input
                value={moduleData.title}
                onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
                placeholder="e.g., Introduction to the Course"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={moduleData.description}
                onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                placeholder="Brief description of this module..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={editingModule ? handleUpdateModule : handleCreateModule}>
              {editingModule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog with Drag-Drop Upload */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Lesson Title</Label>
              <Input
                value={lessonData.title}
                onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                placeholder="e.g., What is Web Development?"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={lessonData.type} onValueChange={(v) => {
                setLessonData({ ...lessonData, type: v as any, content: "" })
                setUploadedFileUrl("")
                setUploadProgress(0)
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={lessonData.duration}
                onChange={(e) => setLessonData({ ...lessonData, duration: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPreview"
                checked={lessonData.isPreview}
                onChange={(e) => setLessonData({ ...lessonData, isPreview: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="isPreview" className="mb-0">Allow as free preview</Label>
            </div>

            {/* Video Upload */}
            {lessonData.type === 'video' && (
              <div className="space-y-2">
                <Label>Video File</Label>
                {uploadedFileUrl ? (
                  <div className="space-y-2">
                    <div className="aspect-video bg-slate-900 rounded-md overflow-hidden">
                      <video src={uploadedFileUrl} controls className="w-full h-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input value={uploadedFileUrl} readOnly className="text-xs" />
                      <Button variant="outline" size="sm" onClick={() => {
                        setUploadedFileUrl("")
                        setLessonData({ ...lessonData, content: "" })
                      }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : uploading ? (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-md p-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                    <p className="text-sm font-medium">Uploading video...</p>
                    <Progress value={uploadProgress} className="w-full mt-2" />
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 'video')}
                    className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-md p-8 text-center transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">Drag & drop video here</p>
                    <p className="text-xs text-slate-500 mt-1">or</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileSelect(e, 'video')}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload">
                      <Button variant="outline" size="sm" className="mt-2 cursor-pointer" asChild>
                        <span>Browse files</span>
                      </Button>
                    </label>
                    <p className="text-xs text-slate-400 mt-2">MP4, MOV, AVI up to 500MB</p>
                  </div>
                )}
              </div>
            )}

            {/* PDF Upload */}
            {lessonData.type === 'pdf' && (
              <div className="space-y-2">
                <Label>PDF Document</Label>
                {uploadedFileUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                    <File className="w-8 h-8 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">PDF uploaded</p>
                      <a href={uploadedFileUrl} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline">View file</a>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setUploadedFileUrl("")
                      setLessonData({ ...lessonData, content: "" })
                    }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : uploading ? (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-md p-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                    <p className="text-sm font-medium">Uploading PDF...</p>
                    <Progress value={uploadProgress} className="w-full mt-2" />
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 'pdf')}
                    className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-md p-8 text-center transition-colors"
                  >
                    <File className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">Drag & drop PDF here</p>
                    <p className="text-xs text-slate-500 mt-1">or</p>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => handleFileSelect(e, 'pdf')}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload">
                      <Button variant="outline" size="sm" className="mt-2 cursor-pointer" asChild>
                        <span>Browse files</span>
                      </Button>
                    </label>
                    <p className="text-xs text-slate-400 mt-2">PDF files up to 50MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Text Content */}
            {lessonData.type === 'text' && (
              <div>
                <Label>Content</Label>
                <Textarea
                  value={lessonData.content}
                  onChange={(e) => setLessonData({ ...lessonData, content: e.target.value })}
                  placeholder="Enter lesson content here..."
                  rows={8}
                />
              </div>
            )}

            {/* Quiz */}
            {lessonData.type === 'quiz' && (
              <div>
                <Label>Quiz URL or ID</Label>
                <Input
                  value={lessonData.content}
                  onChange={(e) => setLessonData({ ...lessonData, content: e.target.value })}
                  placeholder="Enter quiz URL or ID..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsLessonDialogOpen(false)
              resetLessonForm()
            }}>Cancel</Button>
            <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson} disabled={uploading}>
              {uploading ? 'Uploading...' : (editingLesson ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideoUrl} onOpenChange={() => setPreviewVideoUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          {previewVideoUrl && (
            <div className="aspect-video bg-black rounded-md overflow-hidden">
              <video 
                src={previewVideoUrl} 
                controls 
                className="w-full h-full"
                autoPlay
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Quiz Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate AI Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Module</Label>
              <Select value={aiModuleId} onValueChange={setAIModuleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a module..." />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(m => (
                    <SelectItem key={m._id} value={m._id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={aiDifficulty} onValueChange={setAIDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>Cancel</Button>
            <Button onClick={handleGenerateAIQuiz} disabled={aiGenerating}>
              {aiGenerating ? 'Generating...' : <><Sparkles className="w-4 h-4 mr-2" /> Generate Quiz</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
