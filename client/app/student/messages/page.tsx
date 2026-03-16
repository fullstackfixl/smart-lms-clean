"use client"

import { useEffect, useState } from "react"
import { MessageSquare, RefreshCw, ChevronRight, Users } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { API_URL } from "../../../lib/config"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface Conversation {
  _id: string
  type: string
  name?: string
  participants: { _id: string; email: string; profile?: any }[]
  last_message?: { text?: string; timestamp?: string; sender_id?: any }
}

export default function StudentMessagesPage() {
  const { token, user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  async function loadConversations() {
    if (!token) return
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/api/messages/conversations?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      })
      const data = await r.json()
      if (data.success) {
        setConversations(data.data?.conversations || [])
      } else {
        toast.error(data.message || 'Failed to load messages')
      }
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
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
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 mt-1">Your conversations</p>
        </div>
        <Button variant="outline" onClick={loadConversations} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No conversations yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((c) => {
              const title = c.type === 'group'
                ? (c.name || 'Group')
                : (c.participants?.find(p => p._id !== user?._id)?.profile?.fullName || c.participants?.find(p => p._id !== user?._id)?.email || 'Direct Message')

              return (
                <div key={c._id} className="px-6 py-4 hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{title}</p>
                      <p className="text-sm text-slate-600 mt-1 truncate">{c.last_message?.text || 'No messages yet'}</p>
                      <p className="text-xs text-slate-400 mt-2">{c.last_message?.timestamp ? new Date(c.last_message.timestamp).toLocaleString() : ''}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-slate-400">
                      {c.type === 'group' && <Users className="w-4 h-4" />}
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
