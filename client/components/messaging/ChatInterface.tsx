"use client"

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { messagingApi } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { ChatUser, Conversation, ChatMessage } from '../../types/messaging'
import { 
  Search, 
  Send, 
  User as UserIcon, 
  Plus, 
  MessageSquare, 
  ArrowLeft,
  Loader2,
  Check,
  CheckCheck,
  GraduationCap,
  BookOpen,
  Shield
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { UserAvatar } from '../ui/UserAvatar'
import { ProfileDrawer } from './ProfileDrawer'

interface ChatInterfaceProps {
  role: 'admin' | 'instructor' | 'student'
}

// Role badge colours & icons
const ROLE_META: Record<string, { label: string; bg: string; text: string; Icon: any }> = {
  student:    { label: 'Student',    bg: 'bg-orange-100', text: 'text-orange-700', Icon: GraduationCap },
  instructor: { label: 'Instructor', bg: 'bg-blue-100',   text: 'text-blue-700',   Icon: BookOpen },
  teacher:    { label: 'Instructor', bg: 'bg-blue-100',   text: 'text-blue-700',   Icon: BookOpen },
  admin:      { label: 'Admin',      bg: 'bg-purple-100', text: 'text-purple-700', Icon: Shield },
  org_admin:  { label: 'Admin',      bg: 'bg-purple-100', text: 'text-purple-700', Icon: Shield },
}

function getRoleMeta(role?: string) {
  if (!role) return { label: 'User', bg: 'bg-slate-100', text: 'text-slate-600', Icon: UserIcon }
  return ROLE_META[role] ?? { label: role.replace(/_/g, ' '), bg: 'bg-slate-100', text: 'text-slate-600', Icon: UserIcon }
}

function RoleBadge({ role, size = 'sm' }: { role?: string; size?: 'xs' | 'sm' }) {
  const { label, bg, text, Icon } = getRoleMeta(role)
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 rounded-sm font-bold uppercase tracking-wider capitalize",
      bg, text,
      size === 'xs' ? "text-[9px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5"
    )}>
      <Icon className={size === 'xs' ? "h-2 w-2" : "h-2.5 w-2.5"} />
      {label}
    </span>
  )
}

export default function ChatInterface({ role }: ChatInterfaceProps) {
  const { token, user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<ChatUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [showUserList, setShowUserList] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const initialConvId = searchParams.get('conversation')

  const getMessageSenderId = (msg: ChatMessage) => {
    if (!msg.senderId) return null
    return typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id
  }

  const getMessageSenderRole = (msg: ChatMessage): string | undefined => {
    if (!msg.senderId || typeof msg.senderId === 'string') {
      // try to find from participants
      const senderId = getMessageSenderId(msg)
      const participant = selectedConversation?.participants.find(p =>
        typeof p === 'string' ? p === senderId : p._id === senderId
      )
      if (participant && typeof participant !== 'string') return participant.role
      return undefined
    }
    return (msg.senderId as ChatUser).role
  }

  const getMessageSenderName = (msg: ChatMessage) => {
    if (!msg.senderId) return 'System'
    if (typeof msg.senderId !== 'string') {
      return (msg.senderId as ChatUser).display_name
        || (msg.senderId as ChatUser).name
        || (msg.senderId as ChatUser).full_name
        || `${(msg.senderId as ChatUser).first_name ?? ''} ${(msg.senderId as ChatUser).last_name ?? ''}`.trim()
        || 'Unknown User'
    }

    const participant = selectedConversation?.participants.find((p) => {
      if (!p || typeof p === 'string') return p === msg.senderId
      return p._id === msg.senderId
    })

    if (participant && typeof participant !== 'string') {
      return (participant as ChatUser).display_name
        || (participant as ChatUser).name
        || (participant as ChatUser).full_name
        || `${(participant as ChatUser).first_name ?? ''} ${(participant as ChatUser).last_name ?? ''}`.trim()
        || 'Unknown User'
    }

    return 'Unknown User'
  }

  const getConversationTitle = (conv: Conversation) => {
    if (conv.display_name) return conv.display_name
    const other = getOtherParticipant(conv)
    const fallbackName = `${other?.first_name ?? ''} ${other?.last_name ?? ''}`.trim()
    return other?.display_name || other?.name || other?.full_name || fallbackName || 'Conversation'
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    if (!token) return
    try {
      const res = await messagingApi.listConversations(token)
      if (res.success && res.data) {
        setConversations(res.data as Conversation[])
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    if (!token) return
    try {
      const res = await messagingApi.getUsers(token, role)
      if (res.success && res.data) {
        setUsers(res.data as ChatUser[])
      }
    } catch (err) {
      console.error("Failed to fetch users", err)
    }
  }

  const fetchMessages = async (convId: string) => {
    if (!token) return
    try {
      const res = await messagingApi.getConversationMessages(token, convId)
      if (res.success && res.data) {
        setMessages(res.data as ChatMessage[])
      }
    } catch (err) {
       console.error("Failed to fetch messages", err)
    }
  }

  useEffect(() => {
    fetchConversations()
    fetchUsers()
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    if (initialConvId && conversations.length > 0) {
      const conv = conversations.find(c => c._id === initialConvId)
      if (conv) {
        setSelectedConversation(conv)
      }
    }
  }, [initialConvId, conversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation._id)
      scrollToBottom()
      
      const interval = setInterval(() => {
        fetchMessages(selectedConversation._id)
      }, 5000)

      setConversations(prev => prev.map(c => 
        c._id === selectedConversation._id 
          ? { ...c, unreadCount: { ...c.unreadCount, [user?._id || ""]: 0 } }
          : c
      ))

      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const res = await messagingApi.sendMessage(token, selectedConversation._id, newMessage.trim())
      if (res.success && res.data) {
        setMessages(prev => [...prev, res.data as ChatMessage])
        setNewMessage("")
        fetchConversations()
      } else {
        toast.error(res.error || "Failed to send message")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setSending(false)
    }
  }

  const handleStartConversation = async (receiverId: string) => {
    if (!token) return
    try {
      const res = await messagingApi.startConversation(token, receiverId)
      if (res.success && res.data) {
        const conv = res.data as Conversation
        setSelectedConversation(conv)
        setShowUserList(false)
        fetchConversations()
      }
    } catch (err) {
      toast.error("Failed to start conversation")
    }
  }

  const handleViewProfile = async (userId: string) => {
    if (!token) return
    setLoadingProfile(true)
    try {
      const res = await messagingApi.getUserProfile(token, userId)
      if (res.success && res.data) {
        setSelectedUserProfile(res.data)
        setShowProfileDrawer(true)
      }
    } catch (err) {
      toast.error("Failed to load profile")
    } finally {
      setLoadingProfile(false)
    }
  }

  const getOtherParticipant = (conv: Conversation): ChatUser | null => {
    return conv.participants.find(p => (typeof p === 'string' ? p : p._id) !== user?._id) as ChatUser || null
  }

  const filteredUsers = users.filter(u => 
    (u.name || u.full_name || `${u.first_name} ${u.last_name}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredConversations = conversations.filter(c => {
    const other = getOtherParticipant(c)
    const nameStr = c.display_name || c.name || other?.display_name || other?.name || other?.full_name || `${other?.first_name || ''} ${other?.last_name || ''}`.trim()
    return nameStr.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading && conversations.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const otherParticipant = selectedConversation ? getOtherParticipant(selectedConversation) : null

  return (
    <div className="flex h-[750px] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-xl">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col border-r border-slate-100",
        selectedConversation ? "hidden md:flex w-full md:w-80" : "w-full md:w-80"
      )}>

        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-[#f0f2f5]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800">Messages</h2>
          </div>
          <button 
            onClick={() => {
              setShowUserList(!showUserList)
              setSearchTerm("")
            }}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
          >
            {showUserList ? <ArrowLeft className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {/* Search */}
        <div className="p-2 bg-[#f0f2f5] border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={showUserList ? "Search people..." : "Search or start new chat"}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {showUserList ? (
            <div>
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">New Chat</p>
              </div>
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No users found</div>
              ) : (
                filteredUsers.map(u => {
                  const displayName = u.name || u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`
                  const { label, bg, text, Icon } = getRoleMeta(u.role)
                  return (
                    <button 
                      key={u._id}
                      onClick={() => handleStartConversation(u._id)}
                      className="w-full px-4 py-3.5 flex items-center gap-3.5 hover:bg-blue-50/40 transition-colors text-left border-b border-slate-100 group"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="rounded-full ring-2 ring-white shadow-md overflow-hidden h-12 w-12">
                          <UserAvatar
                            name={displayName}
                            src={u.profileImageUrl || (u as any).profilePicture}
                            size="lg"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 leading-tight truncate">{displayName}</p>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-md font-semibold text-[11px] px-2 py-0.5 w-fit",
                          bg, text
                        )}>
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          ) : (
            <div>
              {filteredConversations.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                   <div className="h-14 w-14 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                     <MessageSquare className="h-6 w-6 text-slate-300" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-700">No conversations yet</p>
                     <p className="text-xs text-slate-400 mt-0.5">Click + to start chatting</p>
                   </div>
                   <button 
                    onClick={() => setShowUserList(true)}
                    className="mt-1 text-xs bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700 transition-all shadow-sm"
                   >
                     New Chat
                   </button>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const other = getOtherParticipant(conv)
                  const unread = conv.unreadCount?.[user?._id || ""] || 0
                  const isActive = selectedConversation?._id === conv._id
                  const displayName = getConversationTitle(conv)
                  const { label, bg, text, Icon } = getRoleMeta(other?.role)
                  
                  return (
                    <button 
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full px-4 py-3.5 flex items-center gap-3.5 transition-all text-left border-b border-slate-100 relative",
                        isActive ? "bg-blue-50" : "hover:bg-slate-50"
                      )}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 rounded-r-full" />}

                      {/* Avatar with ring */}
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "rounded-full overflow-hidden h-12 w-12 shadow-md",
                          isActive ? "ring-2 ring-blue-500" : "ring-2 ring-white"
                        )}>
                          <UserAvatar
                            name={displayName}
                            src={other?.profilePicture || (other as any)?.profileImageUrl}
                            size="lg"
                          />
                        </div>
                        {/* Unread dot on avatar */}
                        {unread > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                            <span className="text-[8px] font-black text-white leading-none">{unread > 9 ? '9+' : unread}</span>
                          </div>
                        )}
                      </div>

                      {/* Text info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <p className={cn(
                            "text-[14px] truncate leading-tight",
                            unread > 0 ? "font-black text-slate-900" : "font-bold text-slate-800"
                          )}>
                            {displayName}
                          </p>
                          {conv.lastMessageAt && (
                            <span className={cn(
                              "text-[10px] whitespace-nowrap flex-shrink-0 mt-0.5",
                              unread > 0 ? "text-blue-600 font-bold" : "text-slate-400"
                            )}>
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                            </span>
                          )}
                        </div>
                        {/* Role badge */}
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-md font-semibold text-[11px] px-2 py-0.5 mt-0.5 mb-0.5",
                          bg, text
                        )}>
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                        <p className={cn(
                          "text-[12px] truncate",
                          unread > 0 ? "text-slate-700 font-semibold" : "text-slate-400"
                        )}>
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Window ─────────────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col relative",
        !selectedConversation 
          ? "hidden md:flex items-center justify-center bg-[#f0f2f5] text-slate-400 p-8 text-center"
          : "bg-[#efeae2]"
      )}>

        {/* WhatsApp Background */}
        {selectedConversation && (
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23128C7E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        )}

        {!selectedConversation ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 rounded-3xl bg-white flex items-center justify-center shadow-md border border-slate-100">
               <MessageSquare className="h-11 w-11 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">EduMessenger</h3>
              <p className="text-sm text-slate-400 mt-1 text-center max-w-xs">Select a conversation to start messaging your classmates and faculty.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ──────────────────────────────────────── */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-[#f0f2f5] flex items-center gap-3 z-10 flex-shrink-0">
              <button 
                onClick={() => setSelectedConversation(null)}
                className="p-1.5 md:hidden hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div 
                className="flex flex-1 items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  if (otherParticipant) handleViewProfile(otherParticipant._id)
                }}
              >
                {/* Larger, more prominent avatar */}
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "h-12 w-12 rounded-full overflow-hidden shadow-md",
                    "ring-2 ring-white border-2",
                    otherParticipant?.role === 'student' ? "border-orange-300" :
                    (otherParticipant?.role === 'instructor' || otherParticipant?.role === 'teacher') ? "border-blue-300" :
                    "border-purple-300"
                  )}>
                    <UserAvatar
                      name={getConversationTitle(selectedConversation)}
                      src={otherParticipant?.profilePicture || (otherParticipant as any)?.profileImageUrl}
                      size="lg"
                    />
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-[16px] leading-tight truncate">
                    {getConversationTitle(selectedConversation)}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {/* Prominent role badge */}
                    {(() => {
                      const { label, bg, text, Icon } = getRoleMeta(otherParticipant?.role)
                      return (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-md font-bold text-[11px] px-2 py-0.5",
                          bg, text
                        )}>
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                      )
                    })()}
                    {selectedConversation.contextType && (
                      <span className="text-[10px] text-slate-400 font-medium capitalize">
                        · {selectedConversation.contextType.replace('_', ' ')} thread
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (otherParticipant) handleViewProfile(otherParticipant._id)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-1.5 flex-shrink-0"
              >
                {loadingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : (
                  <><UserIcon className="h-3 w-3" /> View Profile</>
                )}
              </button>
            </div>

            {/* ── Messages Area ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-1 custom-scrollbar relative z-10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                      Messages are end-to-end encrypted
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Date divider at start */}
                  <div className="flex items-center justify-center my-3">
                    <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-semibold text-slate-500">Today</p>
                    </div>
                  </div>

                  {messages.map((msg, index) => {
                    const senderId = getMessageSenderId(msg)
                    const currentUserId = user?._id ? String(user._id) : ''
                    const normalizedSenderId = senderId ? String(senderId) : ''
                    const isMe = normalizedSenderId === currentUserId
                    const senderName = getMessageSenderName(msg)
                    const senderRole = getMessageSenderRole(msg)

                    // Show avatar only for first message in a series from same sender
                    const prevMsg = index > 0 ? messages[index - 1] : null
                    const prevSenderId = prevMsg ? getMessageSenderId(prevMsg) : null
                    const isFirstInGroup = !prevMsg || String(prevSenderId) !== normalizedSenderId

                    if (msg.messageType === 'system') {
                      return (
                        <div key={msg._id} className="flex justify-center my-3">
                          <div className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-[11px] font-medium text-slate-500 shadow-sm border border-slate-100">
                            {msg.text}
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div 
                        key={msg._id} 
                        className={cn(
                          "flex w-full items-end gap-2",
                          isMe ? "justify-end" : "justify-start",
                          isFirstInGroup ? "mt-3" : "mt-0.5"
                        )}
                      >
                        {/* Avatar for received messages */}
                        {!isMe && (
                          <div className={cn(
                            "flex-shrink-0 mb-1",
                            isFirstInGroup ? "visible" : "invisible"
                          )}>
                            <UserAvatar
                              name={senderName}
                              src={
                                typeof msg.senderId !== 'string' && msg.senderId
                                  ? (msg.senderId as ChatUser).profilePicture || (msg.senderId as any).profileImageUrl
                                  : otherParticipant?.profilePicture || (otherParticipant as any)?.profileImageUrl
                              }
                              size="sm"
                              className="h-8 w-8 ring-2 ring-white shadow-sm"
                            />
                          </div>
                        )}

                        <div className={cn(
                          "flex flex-col max-w-[70%] md:max-w-[60%]",
                          isMe ? "items-end" : "items-start"
                        )}>
                          {/* Sender name + role badge (only for received & first in group) */}
                          {!isMe && isFirstInGroup && (
                            <div className="flex items-center gap-1.5 mb-1 pl-1">
                              <span className="text-[12px] font-bold text-blue-700 leading-tight">{senderName}</span>
                              <RoleBadge role={senderRole} size="xs" />
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={cn(
                            "relative px-3 py-2 text-[14px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.15)]",
                            isMe 
                              ? "bg-[#d9fdd3] text-slate-800 rounded-tl-2xl rounded-tr-sm rounded-b-2xl" 
                              : "bg-white text-slate-800 rounded-tr-2xl rounded-tl-sm rounded-b-2xl"
                          )}>
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <div className={cn(
                              "flex items-center gap-1 mt-1 justify-end",
                              isMe ? "text-slate-500" : "text-slate-400"
                            )}>
                              <span className="text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                msg.isRead 
                                  ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> 
                                  : <Check className="h-3.5 w-3.5 text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Spacer for sent messages (no avatar) */}
                        {isMe && <div className="w-8 flex-shrink-0" />}
                      </div>
                    )
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Message Input ─────────────────────────────────────── */}
            <form onSubmit={handleSendMessage} className="px-3 py-2.5 bg-[#f0f2f5] border-t border-slate-200 flex-shrink-0 z-10">
               <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-white rounded-2xl px-4 py-1.5 shadow-sm ring-1 ring-slate-200 focus-within:ring-blue-400 transition-all">
                    <input 
                      type="text" 
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent border-none py-2 text-[14px] text-slate-900 focus:ring-0 focus:outline-none placeholder:text-slate-400"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className={cn(
                      "h-11 w-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 flex-shrink-0",
                      newMessage.trim() && !sending 
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
               </div>
            </form>
           </>
        )}
      </div>

      <ProfileDrawer 
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        userProfile={selectedUserProfile}
        requesterRole={role}
      />
    </div>
  )
}
