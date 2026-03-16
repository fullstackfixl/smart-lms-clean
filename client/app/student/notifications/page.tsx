"use client"

import { useEffect, useState } from "react"
import { Bell, RefreshCw, CheckCircle2 } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { API_URL } from "../../../lib/config"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  priority: string
  status: string
  action_url?: string
  action_text?: string
  created_at: string
}

export default function StudentNotificationsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadNotifications() {
    if (!token) return
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })
      const data = await r.json()
      if (data.success) {
        setItems(data.data?.notifications || [])
        setUnreadCount(data.data?.unread_count || 0)
      } else {
        toast.error(data.message || 'Failed to load notifications')
      }
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">You have {unreadCount} unread notifications</p>
        </div>
        <Button variant="outline" onClick={loadNotifications} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Inbox</h2>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No notifications yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((n) => (
              <div key={n.id} className="px-6 py-4 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{n.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {n.status === 'read' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Read
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded">Unread</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
