"use client"

import { useState, useEffect, useRef } from "react"
import { Send, User, Phone, Video, Paperclip, Search, MoreVertical } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { cn } from "../../../lib/utils"
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"

interface Message {
  id: string
  sender: "me" | "them"
  text: string
  timestamp: string
  read?: boolean
}

interface Contact {
  id: string
  name: string
  email: string
  avatar?: string
  lastMessage: string
  unread: number
  online: boolean
}

export default function InstructorMessagesPage() {
  const { user, token } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch contacts (students)
  useEffect(() => {
    if (!token) return
    fetchContacts()
  }, [token])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      // For now, we'll use a placeholder since there's no direct messages API
      // In a real implementation, this would fetch from /api/instructor/students or similar
      const mockContacts: Contact[] = [
        { id: "1", name: "Alex Johnson", email: "alex@student.com", lastMessage: "Thanks for the help!", unread: 2, online: true },
        { id: "2", name: "Maria Garcia", email: "maria@student.com", lastMessage: "When is the next assignment due?", unread: 0, online: false },
        { id: "3", name: "James Smith", email: "james@student.com", lastMessage: "I am having trouble with the quiz", unread: 1, online: true },
      ]
      setContacts(mockContacts)
      if (mockContacts.length > 0 && !selectedContact) {
        setSelectedContact(mockContacts[0])
      }
    } catch (error) {
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages when contact changes
  useEffect(() => {
    if (!selectedContact || !token) return
    fetchMessages(selectedContact.id)
  }, [selectedContact, token])

  const fetchMessages = async (contactId: string) => {
    try {
      // Placeholder - would fetch from /api/messages/:contactId
      setMessages([])
    } catch (error) {
      console.error("Failed to load messages", error)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact) return
    
    const msg: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true
    }
    
    setMessages(prev => [...prev, msg])
    setNewMessage("")
    
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

    // TODO: Send to API
    // await apiRequest(`/api/messages/${selectedContact.id}`, { method: "POST", token, body: { text: newMessage } })
  }

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <User className="w-3.5 h-3.5" />
            Communication Hub
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 mt-1">Manage your instructional dialogue with students.</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <User className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Contacts List */}
          <div className="border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full pl-10 pr-4 bg-slate-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(600px-73px)]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                  Loading contacts...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <User className="w-12 h-12 mb-2 opacity-20" />
                  No contacts found
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100",
                      selectedContact?.id === contact.id && "bg-blue-50 border-blue-200"
                    )}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {contact.name.charAt(0)}
                      </div>
                      {contact.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                        {contact.unread > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">{contact.lastMessage}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {selectedContact.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{selectedContact.name}</p>
                      <p className="text-sm text-slate-500">
                        {selectedContact.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-600">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-600">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-600">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                        <Send className="w-8 h-8 text-slate-400" />
                      </div>
                      <p>No messages yet</p>
                      <p className="text-sm">Start a conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.sender === "me" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] px-4 py-3 rounded-lg",
                            msg.sender === "me"
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-white border border-gray-200 text-slate-900 rounded-bl-none"
                          )}
                        >
                          <p>{msg.text}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            msg.sender === "me" ? "text-blue-200" : "text-slate-400"
                          )}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-600">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 h-10 px-4 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <p>Select a contact to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
