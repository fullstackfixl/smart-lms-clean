import { useState, useEffect, useCallback } from 'react'
import { liveClassApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export interface LiveClass {
  _id: string
  title: string
  description?: string
  course_id: {
    _id: string
    title: string
  }
  instructor_id?: {
    _id: string
    name: string
  }
  scheduled_date: string
  start_time: string
  duration_minutes: number
  meeting_url?: string
  meeting_room_id?: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  created_at: string
}

export function useLiveClasses() {
  const { token } = useAuth()
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)
      const response = await liveClassApi.listInstructor(token)
      
      if (response.success && (response.data as any)?.classes) {
        setClasses((response.data as any).classes)
      } else {
        throw new Error(response.error || 'Failed to fetch classes')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch classes'
      setError(message)
      console.error('Error fetching live classes:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const createClass = useCallback(async (data: {
    title: string
    description?: string
    course_id: string
    scheduled_date: string
    start_time: string
    duration_minutes: number
  }) => {
    if (!token) return { success: false, error: 'Not authenticated' }

    try {
      const response = await liveClassApi.schedule(token, data)
      
      if (response.success) {
        toast.success('Live class scheduled successfully! 🎉', {
          description: 'Students will receive email and in-app notifications',
        })
        await fetchClasses()
        return { success: true }
      } else {
        throw new Error(response.error || 'Failed to create class')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create class'
      toast.error('Failed to schedule class', {
        description: message,
      })
      return { success: false, error: message }
    }
  }, [token, fetchClasses])

  const cancelClass = useCallback(async (classId: string) => {
    if (!token) return { success: false, error: 'Not authenticated' }

    try {
      const response = await liveClassApi.cancel(token, classId)
      
      if (response.success) {
        toast.success('Class cancelled successfully', {
          description: 'Students will be notified',
        })
        await fetchClasses()
        return { success: true }
      } else {
        throw new Error(response.error || 'Failed to cancel class')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel class'
      toast.error('Failed to cancel class', {
        description: message,
      })
      return { success: false, error: message }
    }
  }, [token, fetchClasses])

  const updateClass = useCallback(async (classId: string, data: Partial<LiveClass>) => {
    if (!token) return { success: false, error: 'Not authenticated' }

    try {
      const response = await liveClassApi.update(token, classId, data)
      
      if (response.success) {
        toast.success('Class updated successfully')
        await fetchClasses()
        return { success: true }
      } else {
        throw new Error(response.error || 'Failed to update class')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update class'
      toast.error('Failed to update class', {
        description: message,
      })
      return { success: false, error: message }
    }
  }, [token, fetchClasses])

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses,
    createClass,
    cancelClass,
    updateClass,
  }
}
