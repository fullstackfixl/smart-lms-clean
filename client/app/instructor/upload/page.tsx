"use client"

import { useState, useEffect, useCallback } from "react"
import { Upload, Video, FileText, File, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface Course {
  _id: string
  title: string
}

interface Section {
  _id: string
  title: string
  course_id: string
}

interface Lesson {
  _id: string
  title: string
  section_id: string
}

export default function InstructorUploadPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedLesson, setSelectedLesson] = useState("")
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchSections(selectedCourse)
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedSection) {
      fetchLessons(selectedSection)
    }
  }, [selectedSection])

  const fetchCourses = async () => {
    setLoadingCourses(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const response = await fetch(`${API_URL}/instructor/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        const coursesData = Array.isArray(data.data) ? data.data : (data.data?.courses || [])
        setCourses(coursesData)
        if (coursesData.length === 0) {
          toast.info('No courses found. Create a course first.')
        }
      } else {
        toast.error(data.message || 'Failed to load courses')
      }
    } catch (error) {
      console.error('Fetch courses error:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const fetchSections = async (courseId: string) => {
    setLoadingSections(true)
    setSections([])
    setLessons([])
    setSelectedSection("")
    setSelectedLesson("")
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      const response = await fetch(`${API_URL}/instructor/courses/${courseId}/sections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        const sectionsData = Array.isArray(data.data) ? data.data : []
        setSections(sectionsData)
        if (sectionsData.length === 0) {
          toast.info('No sections found in this course.')
        }
      } else {
        toast.error(data.message || 'Failed to load sections')
      }
    } catch (error) {
      console.error('Fetch sections error:', error)
      toast.error('Failed to load sections')
    } finally {
      setLoadingSections(false)
    }
  }

  const fetchLessons = async (sectionId: string) => {
    setLoadingLessons(true)
    setLessons([])
    setSelectedLesson("")
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      const response = await fetch(`${API_URL}/instructor/sections/${sectionId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        const lessonsData = Array.isArray(data.data) ? data.data : []
        const videoLessons = lessonsData.filter((l: any) => l.type === 'video')
        setLessons(videoLessons)
        if (videoLessons.length === 0) {
          toast.info('No video lessons found in this section.')
        }
      } else {
        toast.error(data.message || 'Failed to load lessons')
      }
    } catch (error) {
      console.error('Fetch lessons error:', error)
      toast.error('Failed to load lessons')
    } finally {
      setLoadingLessons(false)
    }
  }

  // react-dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        toast.error('File size must be less than 200MB')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        toast.error('Please select a video file')
      } else {
        toast.error('Invalid file. Please try again.')
      }
      return
    }

    // Handle accepted file
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      setUploadSuccess(false)
      toast.success(`Selected: ${selectedFile.name}`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv']
    },
    maxSize: 200 * 1024 * 1024, // 200MB
    multiple: false,
    disabled: uploading
  })

  const handleUpload = async () => {
    if (!file || !selectedLesson) {
      toast.error('Please select a course, section, lesson, and file')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) {
        toast.error('Please login to continue')
        setUploading(false)
        return
      }

      // Get CSRF token first
      console.log('Fetching CSRF token...')
      const csrfResponse = await fetch(`${API_URL}/api/csrf-token`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!csrfResponse.ok) {
        console.error('CSRF fetch failed:', csrfResponse.status)
        toast.error('Failed to get security token')
        setUploading(false)
        return
      }

      const csrfData = await csrfResponse.json()
      console.log('CSRF response:', csrfData)
      
      if (!csrfData.success || !csrfData.data?.csrfToken) {
        console.error('Invalid CSRF response:', csrfData)
        toast.error('Failed to get security token')
        setUploading(false)
        return
      }

      const csrfToken = csrfData.data.csrfToken
      console.log('Got CSRF token:', csrfToken.substring(0, 10) + '...')

      const formData = new FormData()
      formData.append('video', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      console.log('Uploading to:', `${API_URL}/api/instructor/lectures/${selectedLesson}/upload-video`)
      console.log('With CSRF token:', csrfToken.substring(0, 10) + '...')

      const response = await fetch(
        `${API_URL}/api/instructor/lectures/${selectedLesson}/upload-video`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': csrfToken
          },
          credentials: 'include',
          body: formData
        }
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('Upload response status:', response.status)
      const data = await response.json()
      console.log('Upload response data:', data)

      if (response.ok && data.success) {
        setUploadSuccess(true)
        toast.success('Video uploaded successfully!')
        
        // Refetch lessons to update the list
        if (selectedSection) {
          await fetchLessons(selectedSection)
        }
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setFile(null)
          setUploadProgress(0)
          setUploadSuccess(false)
        }, 3000)
      } else {
        console.error('Upload failed:', data)
        toast.error(data.message || data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload video: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Video Lecture</h1>
        <p className="text-muted-foreground">Upload video content to your course lessons</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label>Select Course</Label>
            <Select 
              value={selectedCourse} 
              onValueChange={(value) => {
                setSelectedCourse(value)
                fetchSections(value)
              }}
              disabled={loadingCourses}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Choose a course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 && !loadingCourses && (
                  <div className="p-2 text-sm text-muted-foreground">No courses available</div>
                )}
                {courses.map(course => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Selection */}
          {selectedCourse && (
            <div className="space-y-2">
              <Label>Select Section</Label>
              <Select 
                value={selectedSection} 
                onValueChange={(value) => {
                  setSelectedSection(value)
                  fetchLessons(value)
                }}
                disabled={loadingSections}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSections ? "Loading sections..." : "Choose a section"} />
                </SelectTrigger>
                <SelectContent>
                  {sections.length === 0 && !loadingSections && (
                    <div className="p-2 text-sm text-muted-foreground">No sections available</div>
                  )}
                  {sections.map(section => (
                    <SelectItem key={section._id} value={section._id}>
                      {section.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lesson Selection */}
          {selectedSection && (
            <div className="space-y-2">
              <Label>Select Lesson (Video Type Only)</Label>
              <Select 
                value={selectedLesson} 
                onValueChange={setSelectedLesson}
                disabled={loadingLessons}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingLessons ? "Loading lessons..." : "Choose a lesson"} />
                </SelectTrigger>
                <SelectContent>
                  {lessons.length === 0 && !loadingLessons && (
                    <div className="p-2 text-sm text-muted-foreground">No video lessons available</div>
                  )}
                  {lessons.map(lesson => (
                    <SelectItem key={lesson._id} value={lesson._id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload */}
          {selectedLesson && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Video File</Label>
                <div 
                  {...getRootProps()}
                  className={`
                    relative flex flex-col items-center justify-center py-12 rounded-lg 
                    border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer
                    ${isDragActive 
                      ? 'border-primary bg-primary/10 scale-[1.02]' 
                      : 'border-border bg-background hover:bg-muted/30 hover:border-primary/50'
                    }
                    ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {file ? (
                    <div className="flex flex-col items-center w-full px-4">
                      <div className="relative">
                        <Video className="h-12 w-12 text-primary mb-3 animate-in fade-in zoom-in duration-300" />
                        {!uploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFile(null)
                              setUploadSuccess(false)
                            }}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm font-medium text-center break-all max-w-full">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatFileSize(file.size)}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center animate-in fade-in duration-300">
                      <Upload className={`h-12 w-12 mb-3 transition-all duration-300 ${
                        isDragActive ? 'text-primary scale-110' : 'text-muted-foreground/50'
                      }`} />
                      <p className="text-sm font-medium">
                        {isDragActive ? 'Drop video here' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        MP4, WebM, MOV, AVI, MKV (Max 200MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uploading to Cloudinary...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Success Message */}
              {uploadSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-300" />
                  <p className="text-sm text-emerald-500 font-medium">Video uploaded successfully!</p>
                </div>
              )}

              {/* Upload Info */}
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm text-blue-500">
                    <p className="font-medium">Upload Information:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Videos are uploaded to Cloudinary CDN</li>
                      <li>Multiple resolutions (1080p, 720p, 480p) are generated automatically</li>
                      <li>Maximum file size: 200MB</li>
                      <li>Supported formats: MP4, WebM, MOV, AVI, MKV</li>
                      <li>Upload may take several minutes depending on file size</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full transition-all duration-300 hover:scale-[1.02]"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">How to upload videos:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Select the course where you want to upload the video</li>
          <li>Choose the section within that course</li>
          <li>Select the lesson (only video-type lessons are shown)</li>
          <li>Drag and drop a video file or click to browse</li>
          <li>Click "Upload Video" to start the upload process</li>
          <li>Wait for the upload to complete (this may take a few minutes)</li>
          <li>Once uploaded, students in your organization can watch the video</li>
        </ol>
      </Card>
    </div>
  )
}
