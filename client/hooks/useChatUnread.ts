import { useState, useEffect, useCallback } from 'react'
import { messagingApi } from '../lib/api'
import { useAuth } from '../lib/auth-context'

export function useChatUnread(pollInterval = 30000) {
  const { token } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return

    try {
      const response = await messagingApi.getUnreadCount(token)
      if (response.success && response.data) {
        setUnreadCount((response.data as any).totalUnread || 0)
      }
    } catch (err) {
      console.error('Error fetching chat unread count:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    fetchUnreadCount()

    const interval = setInterval(fetchUnreadCount, pollInterval)
    return () => clearInterval(interval)
  }, [fetchUnreadCount, pollInterval, token])

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount,
  }
}
