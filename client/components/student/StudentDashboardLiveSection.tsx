"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Clock, Calendar, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { liveClassApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns'

interface LiveClass {
  _id: string
  title: string
  course_id: { title: string }
  instructor_id: { name: string }
  scheduled_date: string
  start_time: string
  duration_minutes: number
  status: string
  meeting_url?: string
}

export function StudentDashboardLiveSection() {
  const { token } = useAuth()
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    const fetchClasses = async () => {
      try {
        const response = await liveClassApi.upcoming(token)
        if (response.success && (response.data as any)?.classes) {
          setClasses((response.data as any).classes)
        }
      } catch (error) {
        console.error('Error fetching upcoming classes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
    const interval = setInterval(fetchClasses, 60000)
    return () => clearInterval(interval)
  }, [token])

  const handleJoinClass = async (classId: string) => {
    if (!token) return
    setJoiningId(classId)

    try {
      const response = await liveClassApi.join(token, classId)
      if (response.success && (response.data as any)?.meeting_url) {
        window.open((response.data as any).meeting_url, '_blank', 'noopener,noreferrer')
        toast.success('Joining live class...', { description: 'Opening in new window' })
      } else {
        throw new Error(response.error || 'Failed to join class')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join class'
      toast.error('Cannot join class', { description: message })
    } finally {
      setJoiningId(null)
    }
  }

  const getTimeUntilClass = (scheduledDate: string, startTime: string) => {
    try {
      const classDateTime = parseISO(`${scheduledDate.split('T')[0]}T${startTime}`)
      const now = new Date()
      const minutesUntil = differenceInMinutes(classDateTime, now)

      if (minutesUntil < 0) return { text: 'Started', canJoin: true, color: 'text-green-500' }
      if (minutesUntil <= 10) return { text: 'Starting soon', canJoin: true, color: 'text-orange-500 animate-pulse' }
      if (minutesUntil < 60) return { text: `in ${minutesUntil}m`, canJoin: false, color: 'text-orange-500' }

      const hoursUntil = differenceInHours(classDateTime, now)
      if (hoursUntil < 24) return { text: `in ${hoursUntil}h`, canJoin: false, color: 'text-slate-400' }

      const daysUntil = differenceInDays(classDateTime, now)
      return { text: `in ${daysUntil}d`, canJoin: false, color: 'text-slate-400' }
    } catch {
      return { text: 'Soon', canJoin: false, color: 'text-slate-400' }
    }
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-slate-100 text-lg">Upcoming Classes</h2>
          <Video className="h-5 w-5 text-orange-500" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </motion.div>
    )
  }

  if (classes.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-slate-100 text-lg">Upcoming Classes</h2>
          <Video className="h-5 w-5 text-orange-500" />
        </div>
        <div className="py-12 text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full" />
            <Clock className="relative h-12 w-12 text-slate-600" />
          </div>
          <p className="text-sm text-slate-400">No upcoming classes</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-slate-100 text-lg">Upcoming Classes</h2>
        <Video className="h-5 w-5 text-orange-500" />
      </div>

      <div className="space-y-3">
        {classes.slice(0, 3).map((cls, i) => {
          const timeInfo = getTimeUntilClass(cls.scheduled_date, cls.start_time)
          const isLive = cls.status === 'live'
          const isCancelled = cls.status === 'cancelled'

          return (
            <motion.div key={cls._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group relative overflow-hidden rounded-xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-900/50 p-4 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10">
              {isLive && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-500 border border-green-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${isLive ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20 group-hover:border-orange-500/40'}`}>
                  <Video className={`h-5 w-5 ${isLive ? 'text-green-500' : 'text-orange-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 text-sm line-clamp-1 group-hover:text-orange-500 transition-colors">
                    {cls.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {cls.course_id?.title}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(cls.scheduled_date), 'MMM dd')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {cls.start_time}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold ${timeInfo.color}`}>
                    {timeInfo.text}
                  </span>
                  {timeInfo.canJoin && !isCancelled && (
                    <Button size="sm" onClick={() => handleJoinClass(cls._id)} disabled={joiningId === cls._id} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-500/20 text-xs h-7 px-3">
                      {joiningId === cls._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Video className="h-3 w-3 mr-1" />
                          Join
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
