"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  BookOpen, Plus, Edit, Trash2, GripVertical, Video,
  FileText, CheckCircle, Eye, ArrowLeft, Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useAuth } from "@/lib/auth-context"
import { instructorApi } from "@/lib/api"
import { toast } from "sonner"

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
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  
  // Module dialog
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" })
  
  // Lesson dialog
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    type: "video" as "video" | "text" | "pdf" | "quiz",
    content: "",
    duration: 0,
    isPreview: false,
    uploadMethod: "url" as "url" | "file" | "drag",
    uploadFile: undefined as File | undefined,
    isDragging: false
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

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

  async function handleCreateModule() {
    if (!token || !courseId || !moduleForm.title) {
      toast.error("Module title is required")
      return
    }

    try {
      const res = await instructorApi.createModule(token, courseId, {
        ...moduleForm,
        order: modules.length + 1
      })
      if (res.success) {
        toast.success("Module created successfully")
        setShowModuleDialog(false)
        setModuleForm({ title: "", description: "" })
        loadCourseData()
      } else {
        toast.error(res.error || "Failed to create module")
      }
    } catch (error) {
      toast.error("Failed to create module")
    }
  }

  async function handleUpdateModule() {
    if (!token || !editingModule || !moduleForm.title) {
      toast.error("Module title is required")
      return
    }

    try {
      const res = await instructorApi.updateModule(token, editingModule._id, moduleForm)
      if (res.success) {
        toast.success("Module updated successfully")
        setShowModuleDialog(false)
        setEditingModule(null)
        setModuleForm({ title: "", description: "" })
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
    if (!token || !selectedModuleId || !lessonForm.title) {
      toast.error("Lesson title is required")
      return
    }

    try {
      const module = modules.find(m => m._id === selectedModuleId)
      let contentData: any = {}

      // If file upload is selected, upload the file first
      if (lessonForm.uploadFile && lessonForm.type === 'video') {
        setIsUploading(true)
        setUploadProgress(0)
        toast.info("Uploading video...")
        
        // Get CSRF token
        const csrfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/csrf-token`, {
          credentials: 'include'
        })
        const csrfData = await csrfRes.json()
        
        if (!csrfData.success || !csrfData.data?.csrfToken) {
          toast.error("Failed to get security token")
          setIsUploading(false)
          return
        }

        const formData = new FormData()
        formData.append('video', lessonForm.uploadFile)

        // Use XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(percentComplete)
            toast.info(`Uploading: ${percentComplete}%`, { id: 'upload-progress' })
          }
        })

        const uploadPromise = new Promise<any>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText))
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          })
          
          xhr.addEventListener('error', () => reject(new Error('Upload failed')))
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
          
          xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL}/api/upload/video`)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.setRequestHeader('X-CSRF-Token', csrfData.data.csrfToken)
          xhr.withCredentials = true
          xhr.send(formData)
        })

        try {
          const uploadData = await uploadPromise
          
          if (!uploadData.success) {
            toast.error(uploadData.error || "Failed to upload video")
            setIsUploading(false)
            setUploadProgress(0)
            return
          }

          // Use the uploaded video data
          contentData = {
            videoUrl: uploadData.data.url,
            videoPublicId: uploadData.data.cloudinaryId,
            videoDuration: uploadData.data.duration,
            videoSize: uploadData.data.size
          }
          
          setIsUploading(false)
          setUploadProgress(0)
          toast.success("Video uploaded successfully!")
        } catch (error) {
          console.error('Upload error:', error)
          toast.error("Failed to upload video")
          setIsUploading(false)
          setUploadProgress(0)
          return
        }
      } else if (lessonForm.content) {
        // Use URL if provided
        contentData = { videoUrl: lessonForm.content }
      }

      const res = await instructorApi.createLesson(token, selectedModuleId, {
        title: lessonForm.title,
        description: lessonForm.description,
        type: lessonForm.type,
        content: contentData,
        order: (module?.lessons.length || 0) + 1,
        duration: lessonForm.duration,
        isPreview: lessonForm.isPreview
      })
      
      if (res.success) {
        toast.success("Lesson created successfully")
        setShowLessonDialog(false)
        setLessonForm({
          title: "",
          description: "",
          type: "video",
          content: "",
          duration: 0,
          isPreview: false,
          uploadMethod: "url",
          uploadFile: undefined,
          isDragging: false
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
    if (!token || !editingLesson || !lessonForm.title) {
      toast.error("Lesson title is required")
      return
    }

    try {
      const res = await instructorApi.updateLesson(token, editingLesson._id, lessonForm)
      if (res.success) {
        toast.success("Lesson updated successfully")
        setShowLessonDialog(false)
        setEditingLesson(null)
        setLessonForm({
          title: "",
          description: "",
          type: "video",
          content: "",
          duration: 0,
          isPreview: false,
          uploadMethod: "url",
          uploadFile: undefined,
          isDragging: false
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
      setModuleForm({ title: module.title, description: module.description || "" })
    } else {
      setEditingModule(null)
      setModuleForm({ title: "", description: "" })
    }
    setShowModuleDialog(true)
  }

  function openLessonDialog(moduleId: string, lesson?: Lesson) {
    setSelectedModuleId(moduleId)
    if (lesson) {
      setEditingLesson(lesson)
      setLessonForm({
        title: lesson.title,
        description: lesson.description || "",
        type: lesson.type,
        content: lesson.content || "",
        duration: lesson.duration || 0,
        isPreview: lesson.isPreview,
        uploadMethod: "url",
        uploadFile: undefined,
        isDragging: false
      })
    } else {
      setEditingLesson(null)
      setLessonForm({
        title: "",
        description: "",
        type: "video",
        content: "",
        duration: 0,
        isPreview: false,
        uploadMethod: "url",
        uploadFile: undefined,
        isDragging: false
      })
    }
    setShowLessonDialog(true)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/instructor/courses")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground mt-1">Manage course content</p>
          </div>
        </div>
        <Button onClick={() => openModuleDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Module
        </Button>
      </div>

      {/* Modules & Lessons */}
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
          <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No modules yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first module to organize lessons</p>
          <Button onClick={() => openModuleDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </Button>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {modules.map((module, index) => (
            <AccordionItem
              key={module._id}
              value={module._id}
              className="rounded-xl border border-border/50 bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Module {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold">{module.title}</h3>
                    {module.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {module.lessons.length} lessons
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openModuleDialog(module)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteModule(module._id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-2 mt-2">
                  {module.lessons.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">No lessons in this module</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openLessonDialog(module._id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </div>
                  ) : (
                    <>
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson._id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            {getLessonIcon(lesson.type)}
                            <span className="text-sm font-medium text-muted-foreground">
                              {lessonIndex + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lesson.title}</span>
                              {lesson.isPreview && (
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                          {lesson.duration && (
                            <span className="text-sm text-muted-foreground">
                              {lesson.duration} min
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLessonDialog(module._id, lesson)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => openLessonDialog(module._id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Create Module"}</DialogTitle>
            <DialogDescription>
              {editingModule ? "Update module details" : "Add a new module to organize your lessons"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module-title">Module Title *</Label>
              <Input
                id="module-title"
                placeholder="e.g., Introduction to Programming"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="module-description">Description</Label>
              <Textarea
                id="module-description"
                placeholder="Brief description of this module..."
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingModule ? handleUpdateModule : handleCreateModule}>
              <Save className="h-4 w-4 mr-2" />
              {editingModule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Create Lesson"}</DialogTitle>
            <DialogDescription>
              {editingLesson ? "Update lesson details" : "Add a new lesson to this module"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                placeholder="e.g., Variables and Data Types"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type *</Label>
              <Select
                value={lessonForm.type}
                onValueChange={(value: any) => setLessonForm({ ...lessonForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text/Article</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-description">Description</Label>
              <Textarea
                id="lesson-description"
                placeholder="What will students learn in this lesson?"
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-content">Video/Content Upload</Label>
              <div className="space-y-3">
                {/* Tab Selection */}
                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      lessonForm.uploadMethod === 'url' 
                        ? 'bg-background shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={() => setLessonForm({ ...lessonForm, uploadMethod: 'url' })}
                  >
                    URL Link
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      lessonForm.uploadMethod === 'file' 
                        ? 'bg-background shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={() => setLessonForm({ ...lessonForm, uploadMethod: 'file' })}
                  >
                    File Upload
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      lessonForm.uploadMethod === 'drag' 
                        ? 'bg-background shadow-sm' 
                        : 'hover:bg-background/50'
                    }`}
                    onClick={() => setLessonForm({ ...lessonForm, uploadMethod: 'drag' })}
                  >
                    Drag & Drop
                  </button>
                </div>

                {/* URL Input */}
                {lessonForm.uploadMethod === 'url' && (
                  <div className="space-y-2">
                    <Input
                      id="lesson-content"
                      placeholder="https://example.com/video.mp4 or YouTube/Vimeo URL"
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a direct video URL, YouTube link, or Vimeo link
                    </p>
                  </div>
                )}

                {/* File Upload */}
                {lessonForm.uploadMethod === 'file' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="lesson-file"
                        type="file"
                        accept="video/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setLessonForm({ ...lessonForm, uploadFile: file })
                            toast.info(`Selected: ${file.name}`)
                          }
                        }}
                        className="flex-1"
                      />
                    </div>
                    {lessonForm.uploadFile && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1">{lessonForm.uploadFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(lessonForm.uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload video files (MP4, MOV, AVI) or PDF documents
                    </p>
                  </div>
                )}

                {/* Drag and Drop */}
                {lessonForm.uploadMethod === 'drag' && (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      lessonForm.isDragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setLessonForm({ ...lessonForm, isDragging: true })
                    }}
                    onDragLeave={() => {
                      setLessonForm({ ...lessonForm, isDragging: false })
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setLessonForm({ ...lessonForm, isDragging: false })
                      const file = e.dataTransfer.files[0]
                      if (file) {
                        setLessonForm({ ...lessonForm, uploadFile: file })
                        toast.success(`File dropped: ${file.name}`)
                      }
                    }}
                  >
                    {lessonForm.uploadFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Video className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{lessonForm.uploadFile.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {(lessonForm.uploadFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setLessonForm({ ...lessonForm, uploadFile: undefined })}
                        >
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <div className="p-4 bg-primary/10 rounded-full">
                            <Video className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">Drag and drop your video here</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            or click to browse files
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="video/*,application/pdf"
                          className="hidden"
                          id="drag-file-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setLessonForm({ ...lessonForm, uploadFile: file })
                              toast.success(`File selected: ${file.name}`)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('drag-file-input')?.click()}
                        >
                          Browse Files
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min="0"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-preview">Preview Access</Label>
                <Select
                  value={lessonForm.isPreview ? "yes" : "no"}
                  onValueChange={(value) => setLessonForm({ ...lessonForm, isPreview: value === "yes" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Enrolled Only</SelectItem>
                    <SelectItem value="yes">Free Preview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading video...</span>
                  <span className="font-medium text-orange-500">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson} disabled={isUploading}>
              <Save className="h-4 w-4 mr-2" />
              {isUploading ? `Uploading ${uploadProgress}%` : editingLesson ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
