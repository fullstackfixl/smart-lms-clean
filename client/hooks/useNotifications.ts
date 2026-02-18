import { useState, useEffect, useCallback } from 'react'
import { notificationApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export interface Notification {
  _id: string
  title: string
  message: string
  type: string
  status: 'pending' | 'sent' | 'read' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sender_id?: {
    _id: string
    name: string
  }
  created_at: string
  channels: {
    in_app: {
      read: boolean
      read_at?: string
    }
  }
}

export function useNotifications(pollInterval = 30000) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!token) return

    try {
      const response = await notificationApi.list(token, '?limit=50')
      
      if (response.success && response.data) {
        setNotifications((response.data as any).notifications || [])
        setUnreadCount((response.data as any).unread_count || 0)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchNotifications()

    // Poll for new notifications
    const interval = setInterval(fetchNotifications, pollInterval)
    return () => clearInterval(interval)
  }, [fetchNotifications, pollInterval])

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) return

    try {
      const response = await notificationApi.markAsRead(token, notificationId)
      
      if (response.success) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId
              ? { ...n, status: 'read', channels: { ...n.channels, in_app: { read: true } } }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [token])

  const markAllAsRead = useCallback(async () => {
    if (!token) return

    try {
      const response = await notificationApi.markAllAsRead(token)
      
      if (response.success) {
        toast.success('All notifications marked as read')
        await fetchNotifications()
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
      toast.error('Failed to mark all as read')
    }
  }, [token, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
