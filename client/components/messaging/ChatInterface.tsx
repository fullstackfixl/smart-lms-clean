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
  CheckCheck
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { UserAvatar } from '../ui/UserAvatar'
import { ProfileDrawer } from './ProfileDrawer'

interface ChatInterfaceProps {
  role: 'admin' | 'instructor' | 'student'
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

    // Poll for new conversations/unread counts every 10 seconds
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
      
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedConversation._id)
      }, 5000)

      // Mark as read locally
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
        fetchConversations() // Update last message in list
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
    if (!other) return false
    const nameStr = other.name || other.full_name || `${other.first_name} ${other.last_name}`
    return nameStr.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading && conversations.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex h-[750px] overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-xl">
      {/* Sidebar - Conversations List */}
      <div className={cn(
        "flex flex-col border-r border-slate-100",
        selectedConversation ? "hidden md:flex w-full md:w-80" : "w-full md:w-80"
      )}>
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
          <button 
            onClick={() => {
              setShowUserList(!showUserList)
              setSearchTerm("")
            }}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
          >
            {showUserList ? <ArrowLeft className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={showUserList ? "Search people..." : "Search messages..."}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {showUserList ? (
            <div className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No users found</div>
              ) : (
                filteredUsers.map(u => (
                  <button 
                    key={u._id}
                    onClick={() => handleStartConversation(u._id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-blue-50/50 transition-colors text-left group"
                  >
                    <UserAvatar
                      name={u.name || u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`}
                      src={u.profileImageUrl || (u as any).profilePicture}
                      size="md"
                    />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-slate-900">{u.name || u.full_name || `${u.first_name} ${u.last_name}`}</p>
                      <div className="flex items-center">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider",
                          u.role === 'student' ? "bg-orange-100 text-orange-700" :
                          (u.role === 'instructor' || u.role === 'teacher') ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        )}>
                          {u.role?.replace('_', ' ') || 'User'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredConversations.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                   <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                     <MessageSquare className="h-6 w-6 text-slate-300" />
                   </div>
                   <p className="text-sm font-medium">No conversations yet</p>
                   <button 
                    onClick={() => setShowUserList(true)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                   >
                     Start a new chat
                   </button>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const other = getOtherParticipant(conv)
                  const unread = conv.unreadCount?.[user?._id || ""] || 0
                  const isActive = selectedConversation?._id === conv._id
                  
                  return (
                    <button 
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-4 flex items-center gap-3 transition-all text-left relative border-b border-slate-50",
                        isActive ? "bg-slate-100/50" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <UserAvatar
                          name={other?.display_name || other?.name || other?.full_name || `${other?.first_name ?? ''} ${other?.last_name ?? ''}`}
                          src={other?.profilePicture || (other as any)?.profileImageUrl}
                          size="md"
                        />
                        {/* {isActive && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />} */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className={cn("text-sm truncate", unread > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>
                            {other?.display_name || other?.name || other?.full_name || `${other?.first_name} ${other?.last_name}`}
                          </p>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false }).replace('about ', '')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider",
                            other?.role === 'student' ? "bg-orange-100 text-orange-700" :
                            (other?.role === 'instructor' || other?.role === 'teacher') ? "bg-blue-100 text-blue-700" :
                            "bg-purple-100 text-purple-700"
                          )}>
                            {other?.role?.replace('_', ' ') || 'User'}
                          </span>
                        </div>
                        <p className={cn("text-xs truncate", unread > 0 ? "text-slate-900 font-medium" : "text-slate-500")}>
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {unread > 0 && (
                        <div className="h-5 w-5 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                          {unread}
                        </div>
                      )}
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#e5ddd5]/30 relative",
        !selectedConversation && "hidden md:flex items-center justify-center bg-white text-slate-400 p-8 text-center"
      )}>
        {/* WhatsApp Background Pattern Overlay (Optional, but gives the feel) */}
        {selectedConversation && (
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
               style={{ backgroundImage: `url('https://w0.peakpx.com/wallpaper/580/650/wallpaper-whatsapp-background.jpg')`, backgroundSize: '400px' }} 
          />
        )}

        {!selectedConversation ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-[2.5rem] bg-slate-100 flex items-center justify-center shadow-inner">
               <MessageSquare className="h-10 w-10 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Messages</h3>
              <p className="text-sm">Select a conversation to start chatting.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-slate-100 bg-white shadow-sm flex items-center gap-3 z-10">
              <button 
                onClick={() => setSelectedConversation(null)}
                className="p-2 md:hidden hover:bg-slate-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </button>
              
              <div 
                className="flex flex-1 items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  const other = getOtherParticipant(selectedConversation)
                  if (other) handleViewProfile(other._id)
                }}
              >
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-50 overflow-hidden">
                  <UserAvatar
                    name={getOtherParticipant(selectedConversation)?.display_name || getOtherParticipant(selectedConversation)?.name || ''}
                    src={getOtherParticipant(selectedConversation)?.profilePicture || (getOtherParticipant(selectedConversation) as any)?.profileImageUrl}
                    size="md"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 leading-none">
                    {getOtherParticipant(selectedConversation)?.display_name || 
                     getOtherParticipant(selectedConversation)?.name || 
                     getOtherParticipant(selectedConversation)?.full_name || 
                     `${getOtherParticipant(selectedConversation)?.first_name} ${getOtherParticipant(selectedConversation)?.last_name}`}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium capitalize mt-0.5">
                    {getOtherParticipant(selectedConversation)?.role?.replace('_', ' ') || 'User'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  const other = getOtherParticipant(selectedConversation)
                  if (other) handleViewProfile(other._id)
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-full transition-all uppercase tracking-tighter"
              >
                {loadingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : 'View Profile'}
              </button>
            </div>

            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="h-1 w-12 bg-slate-200 rounded-full" />
                  <p className="text-xs uppercase tracking-widest font-bold">Encrypted End-to-End</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?._id
                  const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId
                  
                  return (
                    <div key={msg._id} className={cn("flex flex-col z-10", isMe ? "items-end" : "items-start")}>
                      <div className={cn(
                        "max-w-[85%] md:max-w-[75%] px-3 py-2 rounded-xl text-[14px] leading-relaxed relative transition-all shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]",
                        isMe 
                          ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none" 
                          : "bg-white text-slate-800 rounded-tl-none"
                      )}>
                        {msg.text}
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-[10px] justify-end",
                          isMe ? "text-slate-500" : "text-slate-400"
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && (
                             msg.isRead ? <CheckCheck className="h-3.5 w-3.5 text-blue-500" /> : <Check className="h-3.5 w-3.5" />
                          )}
                        </div>
                        
                        {/* Message Tail */}
                        <div className={cn(
                          "absolute top-0 w-2 h-3.5",
                          isMe 
                            ? "-right-2 bg-[#dcf8c6] [clip-path:polygon(0_0,0_100%,100%_0)]" 
                            : "-left-2 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]"
                        )} />
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#f0f2f5] border-t border-slate-200">
               <div className="flex items-center gap-2 bg-white rounded-[24px] px-2 py-1 shadow-sm ring-1 ring-slate-200">
                  <input 
                    type="text" 
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent border-none py-3 px-4 text-sm text-slate-900 focus:ring-0 placeholder:text-slate-400"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    disabled={!newMessage.trim() || sending}
                    className={cn(
                      "p-3 rounded-xl transition-all shadow-md active:scale-95",
                      newMessage.trim() && !sending ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"
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
