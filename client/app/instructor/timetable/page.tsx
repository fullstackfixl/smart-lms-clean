"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Calendar, Clock, MapPin, Users, Video } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "../../../lib/auth-context"
import * as instructorService from "../../../lib/services/instructorApi"
import { Button } from "../../../components/ui/button"
import { Skeleton } from "../../../components/ui/skeleton"

type TimetableEntry = {
  _id: string
  programId?: { _id: string; name?: string; code?: string }
  batchId?: { _id: string; name?: string; code?: string; year?: number; semester?: number }
  subjectId?: { _id: string; name?: string; code?: string }
  day: string
  startTime: string
  endTime: string
  room?: string
  meetingLink?: string
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function InstructorTimetablePage() {
  const { token, user } = useAuth()
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isCollege = String(user?.organizationType || "").toUpperCase() === "COLLEGE"

  useEffect(() => {
    loadTimetable()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function loadTimetable() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      if (!isCollege) {
        setEntries([])
        return
      }

      const res = await instructorService.getTimetable()
      if (res.success) {
        const payload: any = res.data
        const list = payload?.entries || payload?.timetable || payload || []
        setEntries(Array.isArray(list) ? list : [])
      } else {
        setError(res.message || "Failed to load timetable")
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.response?.data?.message || e?.message || "Failed to load timetable")
      toast.error("Failed to load timetable")
    } finally {
      setLoading(false)
    }
  }

  const groupedByDay = useMemo(() => {
    const map: Record<string, TimetableEntry[]> = {}
    for (const day of DAYS_ORDER) map[day] = []
    for (const e of entries) {
      if (!map[e.day]) map[e.day] = []
      map[e.day].push(e)
    }
    for (const day of Object.keys(map)) {
      map[day].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
    }
    return map
  }, [entries])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (!isCollege) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Timetable Not Available</h2>
        <p className="text-slate-500 mt-2">This feature is only available for college/institution accounts.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Timetable</h1>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadTimetable}>
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Timetable</h1>
          <p className="text-sm text-slate-500 mt-1">Your batch-wise teaching schedule (auto from assignments).</p>
        </div>
        <Button variant="outline" onClick={loadTimetable}>
          Refresh
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No classes scheduled yet</p>
          <p className="text-sm text-slate-400 mt-1">Classes will appear after Org Admin creates batch timetable.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {DAYS_ORDER.map((day, dayIndex) => {
            const dayEntries = groupedByDay[day] || []
            if (!dayEntries.length) return null

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: dayIndex * 0.05 }}
                className="space-y-3"
              >
                <h2 className="text-lg font-semibold text-slate-900">{day}</h2>
                <div className="space-y-3">
                  {dayEntries.map((entry) => {
                    const subject = entry.subjectId?.name || "Subject"
                    const subjectCode = entry.subjectId?.code ? ` (${entry.subjectId.code})` : ""
                    const batch = entry.batchId?.name || entry.batchId?.code || "Batch"
                    const program = entry.programId?.name || entry.programId?.code

                    return (
                      <div
                        key={entry._id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">
                            {subject}
                            {subjectCode}
                          </div>
                          <div className="text-sm text-slate-600 flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {entry.startTime} - {entry.endTime}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {batch}{program ? ` • ${program}` : ""}
                            </span>
                            {entry.room ? (
                              <span className="inline-flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {entry.room}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {entry.meetingLink ? (
                          <a
                            href={entry.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                          >
                            <Video className="h-4 w-4" />
                            Join
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">No meeting link</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
