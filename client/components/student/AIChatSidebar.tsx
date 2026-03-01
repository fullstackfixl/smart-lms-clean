"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Sparkles, Loader2, User, X, MessageSquare, Bot } from "lucide-react"
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
    message: string
    ai_response: string
    created_at: string
}

interface AIChatSidebarProps {
    lessonId: string
    courseId: string
    lessonTitle: string
    isOpen: boolean
    onClose: () => void
}

import { API_URL } from '../../lib/config'
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

export default function AIChatSidebar({ lessonId, lessonTitle, isOpen, onClose }: AIChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Fetch history
    useEffect(() => {
        if (!isOpen || !lessonId) return

        const fetchHistory = async () => {
            setFetching(true)
            try {
                const r = await fetch(`${API_URL}/api/ai/lesson-chat/${lessonId}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                    credentials: "include"
                })
                const data = await r.json()
                if (data.success) {
                    setMessages(data.data)
                }
            } catch (err) {
                console.error("Failed to fetch chat history", err)
            } finally {
                setFetching(false)
            }
        }

        fetchHistory()
    }, [isOpen, lessonId])

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [messages, loading])

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || loading) return

        const userMsg = input.trim()
        setInput("")
        setLoading(true)

        try {
            const r = await fetch(`${API_URL}/api/ai/lesson-chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                credentials: "include",
                body: JSON.stringify({ lessonId, message: userMsg })
            })

            const data = await r.json()
            if (data.success) {
                setMessages(prev => [...prev, {
                    message: userMsg,
                    ai_response: data.data.ai_response,
                    created_at: data.data.created_at
                }])
            } else {
                toast.error(data.message || "Failed to get AI response")
                setInput(userMsg)
            }
        } catch (err) {
            toast.error("Network error. Please try again.")
            setInput(userMsg)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <aside className="fixed inset-y-0 right-0 w-80 lg:w-96 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">AI Tutor</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Personalized Help</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Chat Body */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-6 pb-4">
                    {/* Welcome Message */}
                    <div className="flex gap-3">
                        <Avatar className="h-8 w-8 border border-slate-100 bg-slate-50">
                            <AvatarFallback className="bg-slate-100 text-slate-600">
                                <Bot className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 max-w-[85%]">
                            <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 leading-relaxed">
                                Hello! I'm your AI tutor. I've analyzed the content for <strong>{lessonTitle}</strong>. How can I help you today?
                            </div>
                        </div>
                    </div>

                    {/* Chat History */}
                    {messages.map((msg, i) => (
                        <div key={i} className="space-y-6">
                            {/* User Message */}
                            <div className="flex flex-row-reverse gap-3">
                                <Avatar className="h-8 w-8 bg-blue-100">
                                    <AvatarFallback className="bg-blue-600 text-white">
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="max-w-[85%]">
                                    <div className="bg-blue-600 rounded-2xl rounded-tr-none p-3 text-sm text-white leading-relaxed shadow-sm">
                                        {msg.message}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* AI Response */}
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 border border-slate-100 bg-slate-50">
                                    <AvatarFallback className="bg-slate-100 text-slate-600">
                                        <Bot className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="max-w-[85%]">
                                    <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 leading-relaxed border border-slate-200/50">
                                        <div dangerouslySetInnerHTML={{ __html: msg.ai_response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex gap-3 animate-pulse">
                            <Avatar className="h-8 w-8 border border-slate-100 bg-slate-50">
                                <AvatarFallback className="bg-slate-100 text-slate-600">
                                    <Bot className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="bg-slate-100 rounded-2xl rounded-tl-none p-4 text-sm text-slate-400 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask your AI tutor..."
                        className="pr-12 h-12 rounded-xl border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || loading}
                        className="absolute right-1.5 top-1.5 h-9 w-9 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
                <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
                    Powered by Groq AI <Sparkles className="h-2 w-2" />
                </p>
            </div>
        </aside>
    )
}
