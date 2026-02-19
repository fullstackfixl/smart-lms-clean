"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Video, Calendar as CalendarIcon, Clock, BookOpen, Loader2, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCourses, scheduleLiveClass } from '@/lib/services/instructorApi'
import { toast } from 'sonner'
import Link from 'next/link'

interface CreateLiveClassModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Course {
  _id: string
  title: string
  status?: string
}

export function CreateLiveClassModal({ open, onClose, onSuccess }: CreateLiveClassModalProps) {
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [courseError, setCourseError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    scheduled_date: '',
    start_time: '',
    duration: 60,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      fetchCourses()
    }
    
    // Reset form when modal closes
    if (!open) {
      resetForm()
    }
  }, [open])

  const fetchCourses = async () => {
    setLoadingCourses(true)
    setCourseError(null)
    
    try {
      const response = await getCourses({ limit: 50 })
      
      if (response.success && response.data) {
        const courseList = response.data.courses || []
        setCourses(courseList)
        
        if (courseList.length === 0) {
          setCourseError('no_courses')
        }
      } else {
        throw new Error('Failed to load courses')
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
      setCourseError(err instanceof Error ? err.message : 'Failed to load courses')
      toast.error('Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.course_id) {
      newErrors.course_id = 'Please select a course'
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Date is required'
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Time is required'
    }

    if (!formData.duration || formData.duration <= 0 || formData.duration > 480) {
      newErrors.duration = 'Duration must be between 1 and 480 minutes'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      const errorMessages = Object.values(errors).join(', ')
      toast.error(`Please fix the errors: ${errorMessages}`)
      return
    }

    setLoading(true)

    try {
      // Combine date and time into ISO string
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.start_time}`)
      
      const payload = {
        title: formData.title,
        description: formData.description,
        course_id: formData.course_id,
        scheduled_date: scheduledDateTime.toISOString(),
        start_time: formData.start_time,
        duration_minutes: Number(formData.duration),
      }

      console.log('📤 Sending live class schedule request:', payload)
      
      const response = await scheduleLiveClass(payload)

      console.log('📥 Response:', response)

      if (response.success) {
        toast.success('Live class scheduled successfully!')
        onSuccess()
        handleClose()
      } else {
        throw new Error(response.message || 'Failed to schedule class')
      }
    } catch (err) {
      console.error('❌ Error scheduling live class:', err)
      const message = err instanceof Error ? err.message : 'Failed to schedule class'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course_id: '',
      scheduled_date: '',
      start_time: '',
      duration: 60,
    })
    setErrors({})
    setCourseError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-xl border-slate-700/50 text-slate-100 p-0 overflow-hidden shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Orange Header */}
          <div className="relative bg-gradient-to-r from-orange-600 to-orange-500 p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                  <CalendarIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Schedule Live Class
                  </h2>
                  <p className="text-sm text-orange-100 mt-0.5">
                    Create a new live session for your students
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-200 font-medium text-sm">
                Class Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to React Hooks"
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-11 transition-all"
              />
              {errors.title && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200 font-medium text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will you cover in this session?"
                rows={3}
                className="bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl resize-none transition-all"
              />
            </div>

            {/* Course Selection */}
            <div className="space-y-2">
              <Label htmlFor="course" className="text-slate-200 font-medium text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-500" />
                Course *
              </Label>
              
              {loadingCourses ? (
                <div className="flex items-center gap-3 text-slate-400 text-sm py-3 px-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span>Loading your courses...</span>
                </div>
              ) : courseError === 'no_courses' ? (
                <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-300 mb-1">No courses available yet</p>
                      <p className="text-xs text-slate-500 mb-3">Create a course first before scheduling live classes</p>
                      <Link href="/instructor/courses">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-500 text-white h-8 text-xs rounded-lg"
                        >
                          Go to Manage Courses
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : courseError ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Failed to load courses</span>
                  </div>
                  <p className="text-xs text-red-300/70 mb-3">{courseError}</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={fetchCourses}
                    variant="outline"
                    className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-11 transition-all">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                    {courses.map((course) => (
                      <SelectItem
                        key={course._id}
                        value={course._id}
                        className="text-slate-100 focus:bg-orange-500/10 focus:text-orange-400 rounded-lg"
                      >
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {errors.course_id && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.course_id}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-200 font-medium text-sm flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-orange-500" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-11 transition-all"
                />
                {errors.scheduled_date && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.scheduled_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-slate-200 font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-slate-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-11 transition-all"
                />
                {errors.start_time && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.start_time}
                  </p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-slate-200 font-medium text-sm">
                Duration (minutes) *
              </Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="480"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                className="bg-slate-800/50 border-slate-700 text-slate-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-11 transition-all"
              />
              {errors.duration && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.duration}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Recommended: 60 minutes for lectures, 90 minutes for workshops
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={loading}
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || loadingCourses || courseError === 'no_courses'}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Schedule Class
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
