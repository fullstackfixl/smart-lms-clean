"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  BookOpen, CheckCircle, XCircle, Eye, Play, FileText, 
  ChevronLeft, RefreshCw, Edit, Trash2, Save, X, Video, Upload, Loader2
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Progress } from "../../../components/ui/progress"
import { useAuth } from "../../../lib/auth-context"
import { API_URL } from "../../../lib/config"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"

interface Lesson {
  _id: string
  title: string
  type: string
  duration: number
  content?: { videoUrl?: string }
}

interface Module {
  _id: string
  title: string
  description?: string
  lessons: Lesson[]
}

interface CourseApplication {
  _id: string
  title: string
  description: string
  category: string
  level: string
  price: number
  status: string
  instructor_id: {
    _id: string
    name: string
    email: string
  }
  modules: Module[]
  submittedAt: string
}

export default function OrgAdminApplicationsPage() {
  const router = useRouter()
  const { token, user } = useAuth()
  const [applications, setApplications] = useState<CourseApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<CourseApplication | null>(null)
  const [editing, setEditing] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [editLessonTitle, setEditLessonTitle] = useState("")
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("")
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  
  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const uploadedUrlRef = useRef("")
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editLevel, setEditLevel] = useState("")
  const [editPrice, setEditPrice] = useState(0)

  useEffect(() => {
    if (token) loadApplications()
  }, [token])

  async function loadApplications() {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/org-admin/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setApplications(data.data?.applications || [])
      }
    } catch (error) {
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(courseId: string) {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/org-admin/applications/${courseId}/approve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Course approved and published to students in your organization")
        loadApplications()
        setSelectedApp(null)
      } else {
        toast.error(data.error || "Failed to approve")
      }
    } catch (error) {
      toast.error("Error approving course")
    }
  }

  async function handleReject(courseId: string) {
    if (!token) return
    const reason = prompt("Enter rejection reason:")
    if (!reason) return

    try {
      const res = await fetch(`${API_URL}/org-admin/applications/${courseId}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Course rejected")
        loadApplications()
        setSelectedApp(null)
      }
    } catch (error) {
      toast.error("Error rejecting course")
    }
  }

  async function handleSaveEdits() {
    if (!token || !selectedApp) return
    try {
      const res = await fetch(`${API_URL}/org-admin/applications/${selectedApp._id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          level: editLevel,
          price: editPrice
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Course updated successfully")
        setSelectedApp({ ...selectedApp, title: editTitle, description: editDescription, category: editCategory, level: editLevel, price: editPrice })
        setEditing(false)
        loadApplications()
      } else {
        toast.error(data.error || "Failed to update")
      }
    } catch (error) {
      toast.error("Error updating course")
    }
  }

  async function handleUpdateModule(moduleId: string, newTitle: string) {
    if (!token || !selectedApp) return
    try {
      const res = await fetch(`${API_URL}/org-admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Module updated")
        const updatedModules = selectedApp.modules.map(m => m._id === moduleId ? { ...m, title: newTitle } : m)
        setSelectedApp({ ...selectedApp, modules: updatedModules })
      }
    } catch (error) {
      toast.error("Error updating module")
    }
  }

  async function handleDeleteModule(moduleId: string) {
    if (!token || !confirm("Delete this module and all its lessons?")) return
    try {
      const res = await fetch(`${API_URL}/org-admin/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Module deleted")
        if (selectedApp) {
          setSelectedApp({ ...selectedApp, modules: selectedApp.modules.filter(m => m._id !== moduleId) })
        }
      }
    } catch (error) {
      toast.error("Error deleting module")
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!token || !confirm("Delete this lesson?")) return
    try {
      const res = await fetch(`${API_URL}/org-admin/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Lesson deleted")
        if (selectedApp) {
          const updatedModules = selectedApp.modules.map(m => ({
            ...m,
            lessons: m.lessons.filter(l => l._id !== lessonId)
          }))
          setSelectedApp({ ...selectedApp, modules: updatedModules })
        }
      }
    } catch (error) {
      toast.error("Error deleting lesson")
    }
  }

  async function handleUpdateLesson(lessonId: string, moduleId: string, newTitle: string, newVideoUrl?: string) {
    if (!token || !selectedApp) return
    try {
      const res = await fetch(`${API_URL}/org-admin/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: newTitle,
          content: newVideoUrl ? { videoUrl: newVideoUrl } : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Lesson updated")
        const updatedModules = selectedApp.modules.map(m => {
          if (m._id !== moduleId) return m
          return {
            ...m,
            lessons: m.lessons.map(l => l._id === lessonId ? { ...l, title: newTitle, content: { videoUrl: newVideoUrl } } : l)
          }
        })
        setSelectedApp({ ...selectedApp, modules: updatedModules })
        setEditingLesson(null)
      }
    } catch (error) {
      toast.error("Error updating lesson")
    }
  }

  const uploadToCloudinary = async (file: File) => {
    if (!token) return null
    setUploading(true)
    setUploadProgress(0)
    try {
      const sigRes = await fetch(`${API_URL}/api/upload/signature?type=video`, {
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
        `https://api.cloudinary.com/v1_1/${sigData.data.cloudName}/video/upload`,
        { method: 'POST', body: formData }
      )
      clearInterval(progressInterval)
      const uploadData = await uploadRes.json()

      if (uploadData.secure_url) {
        setUploadProgress(100)
        uploadedUrlRef.current = uploadData.secure_url
        setEditLessonVideoUrl(uploadData.secure_url)
        toast.success("Video uploaded successfully")
        return uploadData.secure_url
      }
      throw new Error("Upload failed")
    } catch (error) {
      toast.error("Failed to upload video")
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file")
      return
    }
    uploadToCloudinary(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadToCloudinary(file)
  }

  function startEditing(app: CourseApplication) {
    setEditTitle(app.title)
    setEditDescription(app.description)
    setEditCategory(app.category)
    setEditLevel(app.level)
    setEditPrice(app.price)
    setEditing(true)
  }

  if (selectedApp) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => {setSelectedApp(null); setEditing(false);}} className="h-10 w-10 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {editing ? 'Edit Course' : selectedApp.title}
            </h1>
            <p className="text-slate-500">{editing ? 'Make changes before approval' : 'Review and approve course'}</p>
          </div>
          {!editing && (
            <Button variant="outline" onClick={() => startEditing(selectedApp)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Course
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details Card */}
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Course Details</h2>
                {editing && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      <X className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdits}>
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                    </div>
                    <div>
                      <Label>Level</Label>
                      <Input value={editLevel} onChange={(e) => setEditLevel(e.target.value)} />
                    </div>
                    <div>
                      <Label>Price ($)</Label>
                      <Input type="number" value={editPrice} onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-slate-500">Title</span>
                    <span className="font-medium">{selectedApp.title}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-slate-500">Category</span>
                    <span className="font-medium">{selectedApp.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-slate-500">Level</span>
                    <span className="font-medium capitalize">{selectedApp.level}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-slate-500">Price</span>
                    <span className="font-medium">${selectedApp.price}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-slate-500">Instructor</span>
                    <span className="font-medium">{selectedApp.instructor_id?.name}</span>
                  </div>
                  <div className="pt-4">
                    <p className="text-slate-500 text-sm mb-2">Description</p>
                    <p className="text-slate-900">{selectedApp.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modules & Lessons */}
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h2 className="text-lg font-semibold mb-4">Content ({selectedApp.modules.length} Modules)</h2>
              <div className="space-y-4">
                {selectedApp.modules.map((module, idx) => (
                  <div key={module._id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-900">Module {idx + 1}: {module.title}</h3>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const newTitle = prompt("New module title:", module.title)
                            if (newTitle) handleUpdateModule(module._id, newTitle)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => handleDeleteModule(module._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lidx) => (
                        <div key={lesson._id} className="flex items-center gap-3 p-2 bg-slate-50 rounded text-sm">
                          <span className="text-slate-400">{lidx + 1}.</span>
                          {lesson.type === 'video' ? <Play className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-slate-400" />}
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.duration > 0 && <span className="text-slate-400">{lesson.duration} min</span>}
                          {lesson.content?.videoUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-blue-600"
                              onClick={() => setPreviewVideoUrl(lesson.content?.videoUrl || null)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-slate-600"
                            onClick={() => {
                              setEditingLesson(lesson)
                              setEditLessonTitle(lesson.title)
                              setEditLessonVideoUrl(lesson.content?.videoUrl || "")
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-red-600"
                            onClick={() => handleDeleteLesson(lesson._id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-md p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Review Actions</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => handleApprove(selectedApp._id)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={editing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Publish
                </Button>
                <Button 
                  onClick={() => handleReject(selectedApp._id)}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  disabled={editing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-slate-500">
                  Approving will publish this course to all students with organization code: <strong>{(user as any)?.organization_id || 'N/A'}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

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

        {/* Edit Lesson Dialog */}
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Lesson Title</Label>
                <Input 
                  value={editLessonTitle} 
                  onChange={(e) => setEditLessonTitle(e.target.value)} 
                  placeholder="Lesson title"
                />
              </div>
              {editingLesson?.type === 'video' && (
                <div className="space-y-2">
                  <Label>Video</Label>
                  {editLessonVideoUrl ? (
                    <div className="space-y-2">
                      <div className="aspect-video bg-slate-900 rounded-md overflow-hidden">
                        <video src={editLessonVideoUrl} controls className="w-full h-full" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input value={editLessonVideoUrl} readOnly className="text-xs" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setEditLessonVideoUrl("")}
                        >
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
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-md p-8 text-center transition-colors"
                    >
                      <Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                      <p className="text-sm font-medium text-slate-900">Drag & drop video here</p>
                      <p className="text-xs text-slate-500 mt-1">or</p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="video-upload-edit"
                      />
                      <label htmlFor="video-upload-edit">
                        <Button variant="outline" size="sm" className="mt-2 cursor-pointer" asChild>
                          <span>Browse files</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingLesson(null)}>Cancel</Button>
              <Button 
                onClick={() => editingLesson && handleUpdateLesson(
                  editingLesson._id, 
                  selectedApp?.modules.find(m => m.lessons.some(l => l._id === editingLesson._id))?._id || '',
                  editLessonTitle,
                  editLessonVideoUrl
                )}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Applications</h1>
          <p className="text-slate-500 mt-1">Review and approve courses from instructors</p>
        </div>
        <Button variant="outline" onClick={loadApplications}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Instructor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Submitted</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No pending applications</p>
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app._id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{app.title}</div>
                    <div className="text-sm text-slate-500">{app.category} • {app.modules.length} modules</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{app.instructor_id?.name}</td>
                  <td className="px-4 py-4">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                      app.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      app.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-red-100 text-red-700 border-red-200'
                    )}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button size="sm" onClick={() => setSelectedApp(app)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
