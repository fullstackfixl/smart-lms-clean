"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Video, Calendar, Clock, User, Loader2, ExternalLink,
  Radio, BookOpen, Bell, RefreshCw, Users, CheckCircle2,
  XCircle, ChevronRight, Mic, Monitor, Lock
} from "lucide-react"
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'

const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") ||
    window.localStorage.getItem("instatute_token")
    : null

interface LiveClass {
  _id: string
  title: string
  description?: string
  course_id?: { _id: string; title: string; thumbnail?: string }
  instructor_id?: { _id: string; name: string; email: string }
  scheduled_date: string
  start_time: string
  duration_minutes: number
  meeting_url: string | null
  status: "scheduled" | "live" | "completed" | "cancelled"
  canJoin: boolean
  isLive: boolean
  max_participants: number
  current_participants: number
  recording_enabled: boolean
}

function formatDateTime(dateStr: string, startTime: string) {
  const d = new Date(dateStr)
  const [h, m] = (startTime || "00:00").split(":").map(Number)
  d.setHours(h, m, 0, 0)
  return {
    date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    full: d
  }
}

function timeUntil(dateStr: string, startTime: string) {
  const d = new Date(dateStr)
  const [h, m] = (startTime || "00:00").split(":").map(Number)
  d.setHours(h, m, 0, 0)
  const diff = d.getTime() - Date.now()
  if (diff <= 0) return null
  const hrs = Math.floor(diff / 3_600_000)
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  if (hrs > 24) return `${Math.floor(hrs / 24)}d away`
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

export default function StudentLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "completed">("all")

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API_URL}/student/live-classes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) {
        setClasses(data.data?.classes || [])
      } else {
        toast.error(data.message || "Failed to load live classes")
      }
    } catch {
      toast.error("Network error loading live classes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
    const interval = setInterval(fetchClasses, 60_000)
    return () => clearInterval(interval)
  }, [fetchClasses])

  const filtered = classes.filter(lc => {
    if (filter === "live") return lc.isLive || lc.status === "live"
    if (filter === "upcoming") return lc.status === "scheduled" && !lc.isLive
    if (filter === "completed") return lc.status === "completed"
    return true
  })

  const liveCount = classes.filter(c => c.isLive || c.status === "live").length
  const upcomingCount = classes.filter(c => c.status === "scheduled" && !c.isLive).length
  const completedCount = classes.filter(c => c.status === "completed").length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center relative">
          <Video className="h-8 w-8 text-purple-600 animate-pulse" />
          <Loader2 className="absolute -top-1 -right-1 h-5 w-5 animate-spin text-purple-600" />
        </div>
        <p className="text-slate-500 font-semibold text-lg">Loading live classes…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Video className="h-5 w-5 text-white" />
            </span>
            Live <span className="text-purple-600">Classes</span>
          </h1>
          <p className="text-slate-500 mt-1 ml-1">Real-time sessions from your instructors</p>
        </div>
        <Button
          onClick={fetchClasses}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      {classes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Live Now", value: liveCount, color: "text-green-600 bg-green-50", icon: Radio },
            { label: "Upcoming", value: upcomingCount, color: "text-purple-600 bg-purple-50", icon: Calendar },
            { label: "Completed", value: completedCount, color: "text-slate-500 bg-slate-50", icon: CheckCircle2 },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${s.color.split(" ")[1]} flex items-center justify-center shrink-0`}>
                  <s.icon className={`h-5 w-5 ${s.color.split(" ")[0]}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "live", "upcoming", "completed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${filter === f
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            {f === "live" ? "🔴 Live Now" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all" && classes.length > 0 && (
              <span className="ml-2 bg-white/30 rounded-full px-1.5 text-xs">{classes.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Classes list ── */}
      {classes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="h-20 w-20 rounded-2xl bg-purple-50 flex items-center justify-center">
            <Video className="h-10 w-10 text-purple-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">No live classes yet</h3>
          <p className="text-slate-400 text-center max-w-sm">
            Your instructors haven't scheduled any sessions yet. You'll be notified when one goes live.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
            <Bell className="h-4 w-4" />
            <span>Email notifications enabled for your account</span>
          </div>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">No classes match this filter</p>
          <button onClick={() => setFilter("all")} className="mt-2 text-purple-600 text-sm font-semibold hover:underline">
            Show all
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lc, idx) => {
            const { date, time } = formatDateTime(lc.scheduled_date, lc.start_time)
            const until = timeUntil(lc.scheduled_date, lc.start_time)
            const capacity = lc.max_participants > 0
              ? Math.round((lc.current_participants / lc.max_participants) * 100)
              : 0

            return (
              <motion.div
                key={lc._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`border-0 shadow-md rounded-2xl overflow-hidden transition-all hover:shadow-lg ${lc.isLive ? "ring-2 ring-green-400" : ""
                  }`}>
                  {/* Status strip */}
                  <div className={`h-1.5 w-full ${lc.isLive ? "bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" :
                      lc.status === "completed" ? "bg-slate-300" :
                        lc.status === "cancelled" ? "bg-red-400" :
                          "bg-gradient-to-r from-purple-400 to-indigo-500"
                    }`} />

                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-5">
                      {/* Left content */}
                      <div className="flex-1 min-w-0">
                        {/* Badge row */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {lc.isLive ? (
                            <Badge className="bg-green-50 text-green-700 border border-green-300 gap-1 animate-pulse">
                              <Radio className="h-3 w-3" /> Live Now
                            </Badge>
                          ) : lc.status === "completed" ? (
                            <Badge className="bg-slate-100 text-slate-600 border border-slate-200 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </Badge>
                          ) : lc.status === "cancelled" ? (
                            <Badge variant="destructive" className="gap-1 opacity-75">
                              <XCircle className="h-3 w-3" /> Cancelled
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-50 text-purple-700 border border-purple-200 gap-1">
                              <Calendar className="h-3 w-3" /> Scheduled
                            </Badge>
                          )}
                          {until && !lc.isLive && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 gap-1">
                              <Clock className="h-3 w-3" /> {until}
                            </Badge>
                          )}
                          {lc.course_id && (
                            <Badge variant="outline" className="gap-1 text-slate-500">
                              <BookOpen className="h-3 w-3" />
                              {lc.course_id.title}
                            </Badge>
                          )}
                          {lc.recording_enabled && (
                            <Badge variant="outline" className="gap-1 text-rose-500 border-rose-200">
                              <Mic className="h-3 w-3" /> Recorded
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">{lc.title}</h3>
                        {lc.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{lc.description}</p>
                        )}

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0 text-slate-400" />
                            <span>{lc.instructor_id?.name || "Instructor"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                            <span>{time} · {lc.duration_minutes}min</span>
                          </div>
                        </div>

                        {/* Capacity bar */}
                        {lc.max_participants > 0 && lc.status !== "completed" && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> {lc.current_participants}/{lc.max_participants} participants
                              </span>
                              <span>{capacity}% full</span>
                            </div>
                            <Progress
                              value={capacity}
                              className={`h-1.5 ${capacity > 80 ? "[&>div]:bg-red-400" : "[&>div]:bg-purple-500"}`}
                            />
                          </div>
                        )}
                      </div>

                      {/* Right: Join button */}
                      <div className="flex md:flex-col items-center md:justify-center gap-3 shrink-0">
                        {lc.status === "completed" ? (
                          <Button disabled variant="outline" className="gap-2 rounded-xl opacity-60">
                            <CheckCircle2 className="h-4 w-4" /> Ended
                          </Button>
                        ) : lc.status === "cancelled" ? (
                          <Button disabled variant="destructive" className="gap-2 rounded-xl opacity-60">
                            <XCircle className="h-4 w-4" /> Cancelled
                          </Button>
                        ) : lc.meeting_url ? (
                          <a href={lc.meeting_url} target="_blank" rel="noopener noreferrer">
                            <Button
                              className={`gap-2 rounded-xl font-bold shadow-md transition-all ${lc.canJoin
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-200"
                                  : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-purple-200"
                                }`}
                            >
                              {lc.canJoin ? (
                                <><Radio className="h-4 w-4 animate-pulse" /> Join Now</>
                              ) : (
                                <><Monitor className="h-4 w-4" /> View Link</>
                              )}
                            </Button>
                          </a>
                        ) : (
                          <Button disabled variant="outline" className="gap-2 rounded-xl opacity-60">
                            <Lock className="h-4 w-4" /> Link TBA
                          </Button>
                        )}
                        {!lc.canJoin && !lc.isLive && until && (
                          <p className="text-xs text-slate-400 text-center">
                            Opens 10 min<br />before class
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
