"use client"

import React, { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import {
  Search,
  Filter,
  MessageSquareMore,
  AlertTriangle,
  Clock3,
  Users,
  RefreshCw,
  ArrowRight,
  ShieldAlert
} from "lucide-react"
import { platformJsonFetcher } from "../../../lib/platform-fetcher"
import { PlatformErrorState } from "../../../components/platform/platform-error-state"
import { FlatMetricCard } from "../../../components/platform/flat-metric-card"
import { Card } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { ScrollArea } from "../../../components/ui/scroll-area"
import { Skeleton } from "../../../components/ui/skeleton"
import { cn } from "../../../lib/utils"

type Conversation = {
  _id: string
  label?: string
  name?: string
  type?: string
  contextType?: string
  lastMessage?: string
  lastMessageAt?: string
  escalationLevel?: string
  responseTimeMinutes?: number | null
  unreadTotal?: number
  participants?: Array<{ _id: string; name: string; email?: string; role?: string }>
}

type Message = {
  _id: string
  text: string
  createdAt: string
  senderId?: { _id: string; name: string; email?: string; role?: string }
}

export default function PlatformCommunicationPage() {
  const [search, setSearch] = useState("")
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [escalationOnly, setEscalationOnly] = useState(false)

  const overviewKey = "/api/platform/communication/overview"
  const conversationsKey = `/api/platform/conversations?search=${encodeURIComponent(search)}${escalationOnly ? "&escalated=true" : ""}&limit=50`
  const { data: overviewRes, error: overviewError, isLoading: overviewLoading } = useSWR(overviewKey, platformJsonFetcher)
  const { data: conversationsRes, error: conversationsError, isLoading: conversationsLoading, mutate: mutateConversations } = useSWR(conversationsKey, platformJsonFetcher)

  const conversations: Conversation[] = useMemo(
    () => (conversationsRes?.data?.conversations as Conversation[]) ?? [],
    [conversationsRes]
  )
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedConversationId) || conversations[0] || null,
    [conversations, selectedConversationId]
  )

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0]._id)
    }
  }, [conversations, selectedConversationId])

  const messagesKey = selectedConversation
    ? `/api/platform/messages/${selectedConversation._id}?limit=100`
    : null
  const { data: messagesRes, error: messagesError, isLoading: messagesLoading } = useSWR(messagesKey, platformJsonFetcher)
  const messages: Message[] = messagesRes?.data?.messages || []

  if (overviewError || conversationsError || messagesError) {
    return <PlatformErrorState title="Communication monitor unavailable" message="We couldn't load the platform conversation stream." />
  }

  const metrics = overviewRes?.data || {
    totalConversations: 0,
    escalatedConversations: 0,
    unreadConversations: 0,
    averageResponseTimeMinutes: 0
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              <MessageSquareMore className="h-3.5 w-3.5" />
              Platform Communication Monitor
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Conversation Oversight</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Inspect escalation threads, response latency, and cross-tenant conversations from one global console.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50" onClick={() => mutateConversations()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700">
              Open Live Feed
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <FlatMetricCard title="Conversations" value={overviewLoading ? "..." : metrics.totalConversations} icon={MessageSquareMore} subtitle="Global threads" />
        <FlatMetricCard title="Escalations" value={overviewLoading ? "..." : metrics.escalatedConversations} icon={AlertTriangle} subtitle="Flagged threads" className="border-l-4 border-l-amber-500" />
        <FlatMetricCard title="Unread Threads" value={overviewLoading ? "..." : metrics.unreadConversations} icon={Users} subtitle="Needs attention" className="border-l-4 border-l-blue-500" />
        <FlatMetricCard title="Avg Response" value={overviewLoading ? "..." : `${metrics.averageResponseTimeMinutes || 0}m`} icon={Clock3} subtitle="Across active conversations" className="border-l-4 border-l-emerald-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations, orgs, or participants..."
                className="h-11 rounded-xl border-slate-200 pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={escalationOnly ? "default" : "outline"}
                className={cn(
                  "h-10 rounded-xl font-bold",
                  escalationOnly ? "bg-amber-500 text-white hover:bg-amber-600" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
                onClick={() => setEscalationOnly((value) => !value)}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Escalations
              </Button>
              <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>

          <ScrollArea className="mt-5 h-[700px] pr-3">
            <div className="space-y-3">
              {conversationsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-2xl" />
                ))
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => {
                  const active = selectedConversation?._id === conversation._id
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => setSelectedConversationId(conversation._id)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition-all",
                        active ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn("truncate text-sm font-bold", active ? "text-blue-700" : "text-slate-950")}>
                              {conversation.label || conversation.name || "Conversation"}
                            </p>
                            {conversation.escalationLevel && conversation.escalationLevel !== "none" && (
                              <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                                {conversation.escalationLevel}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {conversation.unreadTotal ? (
                            <Badge className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {conversation.unreadTotal}
                            </Badge>
                          ) : null}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {conversation.responseTimeMinutes !== null && conversation.responseTimeMinutes !== undefined
                              ? `${conversation.responseTimeMinutes}m`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span>{conversation.type || "direct"}</span>
                        <span>{conversation.participants?.length || 0} participants</span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-bold text-slate-900">No conversations found</p>
                  <p className="mt-1 text-xs text-slate-500">Try a wider search or clear escalation filtering.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="rounded-3xl border-slate-200 p-0 shadow-sm overflow-hidden">
          {selectedConversation ? (
            <>
              <div className="border-b border-slate-100 bg-slate-50/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-950">{selectedConversation.label || selectedConversation.name || "Conversation"}</h2>
                      {selectedConversation.escalationLevel && selectedConversation.escalationLevel !== "none" && (
                        <Badge className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                          {selectedConversation.escalationLevel}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {selectedConversation.contextType || selectedConversation.type || "direct"} thread
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    Response time {selectedConversation.responseTimeMinutes !== null && selectedConversation.responseTimeMinutes !== undefined
                      ? `${selectedConversation.responseTimeMinutes} minutes`
                      : "not enough activity yet"}
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[650px]">
                <div className="space-y-4 p-6">
                  {messagesLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 rounded-2xl" />
                    ))
                  ) : messages.length > 0 ? (
                    messages.map((message) => {
                      return (
                        <div key={message._id} className="flex justify-start">
                          <div className="max-w-[80%] rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                {message.senderId?.name || "System"}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.text}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                      <MessageSquareMore className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-4 text-sm font-bold text-slate-900">No messages in this thread</p>
                      <p className="mt-1 text-xs text-slate-500">Conversation metadata loaded, but there are no message rows yet.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Participants</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedConversation.participants?.length || 0}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unread</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedConversation.unreadTotal || 0}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Context</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">{selectedConversation.contextType || "direct"}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Escalation follow-up</p>
                    <p className="text-xs text-slate-500">Use this panel to jump into the underlying tenant and resolve the issue.</p>
                  </div>
                  <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50">
                    Open org context
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[760px] items-center justify-center p-10 text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <MessageSquareMore className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-lg font-bold text-slate-950">No conversation selected</h2>
                <p className="mt-2 text-sm text-slate-500">Pick a thread from the left to inspect messages and escalation details.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
