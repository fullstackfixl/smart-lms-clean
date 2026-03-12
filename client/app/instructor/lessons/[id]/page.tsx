"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { 
  ArrowLeft, Upload, Video, FileText, CheckCircle, X, 
  Play, Clock, Save, Loader2
} from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import { Progress } from "../../../../components/ui/progress"
import { useAuth } from "../../../../lib/auth-context"
import { API_URL } from "../../../../lib/config"
import { toast } from "sonner"
import { cn } from "../../../../lib/utils"

interface Lesson {
  _id: string
  title: string
  description?: string
  type: "video" | "text" | "pdf" | "quiz"
  content?: {
    videoUrl?: string
    text?: string
    pdfUrl?: string
  }
  duration?: number
  isPreview: boolean
  module_id: string
  course_id: string
}

export default function LessonDetailPage() {
  const router = useRouter()
  const { token } = useAuth()
  const params = useParams<{ id: string }>()
  const lessonId = params?.id

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState(0)
  const [isPreview, setIsPreview] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [textContent, setTextContent] = useState("")
  
  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (token && lessonId) loadLesson()
  }, [token, lessonId])

  async function loadLesson() {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/instructor/lessons/${lessonId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        const lessonData = data.data
        setLesson(lessonData)
        setTitle(lessonData.title || "")
        setDescription(lessonData.description || "")
        setDuration(lessonData.duration || 0)
        setIsPreview(lessonData.isPreview || false)
        setVideoUrl(lessonData.content?.videoUrl || "")
        setTextContent(lessonData.content?.text || "")
      }
    } catch (error) {
      toast.error("Failed to load lesson")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!token || !lesson) return
    setSaving(true)
    try {
      const content: any = {}
      if (lesson.type === 'video') content.videoUrl = videoUrl
      if (lesson.type === 'text') content.text = textContent

      const res = await fetch(`${API_URL}/instructor/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          description,
          duration,
          isPreview,
          content
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Lesson saved successfully")
      } else {
        toast.error(data.error || "Failed to save")
      }
    } catch (error) {
      toast.error("Error saving lesson")
    } finally {
      setSaving(false)
    }
  }

  const handleVideoUpload = useCallback(async (file: File) => {
    if (!token) return
    
    setUploading(true)
    setUploadProgress(0)

    try {
      // Get upload signature from backend
      const sigRes = await fetch(`${API_URL}/upload/signature`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const sigData = await sigRes.json()
      
      if (!sigData.success) {
        throw new Error("Failed to get upload signature")
      }

      // Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sigData.data.apiKey)
      formData.append('timestamp', sigData.data.timestamp)
      formData.append('signature', sigData.data.signature)
      formData.append('folder', sigData.data.folder)

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.data.cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      // Simulate progress (Cloudinary doesn't support progress on direct uploads easily)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const uploadData = await uploadRes.json()
      clearInterval(progressInterval)

      if (uploadData.secure_url) {
        setUploadProgress(100)
        setVideoUrl(uploadData.secure_url)
        toast.success("Video uploaded successfully")
        
        // Auto-save the video URL
        await handleSave()
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast.error("Failed to upload video")
    } finally {
      setUploading(false)
    }
  }, [token])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      handleVideoUpload(file)
    } else {
      toast.error("Please upload a video file")
    }
  }, [handleVideoUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleVideoUpload(file)
    }
  }, [handleVideoUpload])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg font-medium">Lesson not found</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="h-10 w-10 p-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{title || "Untitled Lesson"}</h1>
          <p className="text-slate-500 text-sm">{lesson.type === 'video' ? 'Video Lesson' : 'Text Lesson'}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Lesson Details</h2>
          
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this lesson"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="preview"
                checked={isPreview}
                onChange={(e) => setIsPreview(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="preview" className="mb-0">Allow preview (free)</Label>
            </div>
          </div>
        </div>

        {/* Video Upload Section */}
        {lesson.type === 'video' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Video Content</h2>
            
            {videoUrl ? (
              <div className="space-y-4">
                <div className="aspect-video bg-slate-900 rounded-md overflow-hidden">
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full h-full"
                    poster="/video-placeholder.jpg"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500 truncate flex-1 mr-4">
                    {videoUrl}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setVideoUrl("")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-md p-12 text-center transition-colors",
                  uploading ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                )}
              >
                {uploading ? (
                  <div className="space-y-4">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
                    <p className="text-sm font-medium">Uploading video...</p>
                    <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                  </div>
                ) : (
                  <>
                    <Video className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg font-medium text-slate-900 mb-2">Upload Video</p>
                    <p className="text-sm text-slate-500 mb-4">Drag and drop or click to browse</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>Select Video</span>
                      </Button>
                    </label>
                    <p className="text-xs text-slate-400 mt-4">MP4, MOV, AVI up to 500MB</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Text Content Section */}
        {lesson.type === 'text' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Text Content</h2>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter lesson content here..."
              rows={15}
            />
          </div>
        )}
      </div>
    </div>
  )
}
