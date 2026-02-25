"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Video, Calendar, Clock, Link as LinkIcon, User,
  Loader2, ExternalLink, Radio, BookOpen, Bell
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { API_URL as API } from "@/lib/config"

const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
    : null

interface LiveClass {
  _id: string
  title: string
  description?: string
  course_id?: { _id: string; title: string }
  instructor_id?: { _id: string; name: string; email: string }
  scheduled_date: string
  start_time: string
  duration_minutes: number
  meeting_url: string
  status: "scheduled" | "live" | "completed" | "cancelled"
  canJoin: boolean
  isLive: boolean
}

export default function StudentLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/student/live-classes`, {
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
    // Refresh every 60s to update canJoin state
    const interval = setInterval(fetchClasses, 60_000)
    return () => clearInterval(interval)
  }, [fetchClasses])

  const formatDateTime = (dateStr: string, startTime: string) => {
    const d = new Date(dateStr)
    const [h, m] = startTime.split(":")
    d.setHours(Number(h), Number(m))
    return d.toLocaleString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const timeUntil = (dateStr: string, startTime: string) => {
    const d = new Date(dateStr)
    const [h, m] = startTime.split(":")
    d.setHours(Number(h), Number(m))
    const diff = d.getTime() - Date.now()
    if (diff < 0) return null
    const hrs = Math.floor(diff / 3_600_000)
    const mins = Math.floor((diff % 3_600_000) / 60_000)
    if (hrs > 24) return `in ${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) !== 1 ? "s" : ""}`
    if (hrs > 0) return `in ${hrs}h ${mins}m`
    return `in ${mins} minute${mins !== 1 ? "s" : ""}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Video className="h-8 w-8 text-purple-600" />
              Live Classes
            </h1>
            <p className="text-muted-foreground mt-1">Upcoming sessions from your instructors</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchClasses} className="gap-1">
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Classes */}
      {classes.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="relative inline-block mb-6">
            <Video className="h-20 w-20 mx-auto text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No upcoming live classes</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your instructor hasn't scheduled any sessions yet. You'll receive an email when one is scheduled.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>Email notifications are enabled for your account</span>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {classes.map((lc, idx) => {
            const until = timeUntil(lc.scheduled_date, lc.start_time)
            return (
              <motion.div
                key={lc._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
              >
                <Card className={`overflow-hidden transition-shadow hover:shadow-lg ${lc.isLive ? "border-green-400 shadow-green-100 dark:shadow-green-950/20" : ""}`}>
                  {/* Live indicator bar */}
                  {lc.isLive && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1.5 flex items-center gap-2">
                      <Radio className="h-3.5 w-3.5 text-white animate-pulse" />
                      <span className="text-white text-xs font-bold tracking-wider uppercase">Live Now</span>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Left: Content */}
                      <div className="flex-1 min-w-0">
                        {/* Badge row */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {lc.status === "live" || lc.isLive ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 border animate-pulse text-xs">🔴 Live</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Scheduled</Badge>
                          )}
                          {until && !lc.isLive && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">⏰ {until}</Badge>
                          )}
                          {lc.course_id && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <BookOpen className="h-2.5 w-2.5" />
                              {lc.course_id.title}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-bold leading-tight mb-1">{lc.title}</h3>
                        {lc.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{lc.description}</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 shrink-0" />
                            <span>{lc.instructor_id?.name || "Instructor"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{lc.duration_minutes} minutes</span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{formatDateTime(lc.scheduled_date, lc.start_time)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Join button */}
                      <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 shrink-0">
                        {lc.meeting_url ? (
                          <a href={lc.meeting_url} target="_blank" rel="noopener noreferrer">
                            <Button
                              className={`gap-2 ${lc.canJoin
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md shadow-green-200 dark:shadow-green-900/30"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"}`}
                            >
                              {lc.canJoin ? (
                                <><Radio className="h-4 w-4 animate-pulse" /> Join Now</>
                              ) : (
                                <><ExternalLink className="h-4 w-4" /> Meeting Link</>
                              )}
                            </Button>
                          </a>
                        ) : (
                          <div className="text-xs text-muted-foreground">Link TBA</div>
                        )}
                        {!lc.canJoin && !lc.isLive && until && (
                          <span className="text-xs text-muted-foreground text-center">Opens 10 min before</span>
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
