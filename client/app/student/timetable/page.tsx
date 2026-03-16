"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, AlertCircle, Clock, MapPin, User } from "lucide-react"
import { EmptySection } from '../../../components/student/EmptySection'
import { Skeleton } from '../../../components/ui/skeleton'
import { toast } from "sonner"
import { useAuth } from '../../../lib/auth-context'
import { collegeApi } from '../../../lib/api'
import { getTimetable } from '../../../lib/services/studentApi'

interface TimetableEntry {
  _id: string
  course_id: {
    _id: string
    title: string
  }
  instructor_id: {
    name: string
  }
  day_of_week: string
  start_time: string
  end_time: string
  room?: string
  type: string
}

type CollegeTimetableEntry = {
  _id: string
  subjectId?: { _id: string; name: string; code?: string }
  instructorId?: { _id: string; profile?: { firstName?: string; lastName?: string } }
  day: string
  startTime: string
  endTime: string
  room?: string
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function TimetablePage() {
  const { user, token } = useAuth()
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  useEffect(() => {
    loadTimetable()
  }, [token])

  async function loadTimetable() {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      let response
      if (isCollege) {
        response = await collegeApi.getStudentTimetable(token)
      } else {
        response = await getTimetable()
      }
      
      if (response.success && response.data) {
        // Handle different response structures
        const data = response.data
        const rawEntries: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any).entries)
            ? (data as any).entries
            : Array.isArray((data as any).timetable)
              ? (data as any).timetable
              : []

        if (isCollege) {
          const normalized = rawEntries.map((e: CollegeTimetableEntry) => {
            const instructorName = `${e.instructorId?.profile?.firstName || ''} ${e.instructorId?.profile?.lastName || ''}`.trim()
            return {
              _id: e._id,
              course_id: {
                _id: e.subjectId?._id || e._id,
                title: e.subjectId?.name || 'Subject'
              },
              instructor_id: {
                name: instructorName || 'Instructor'
              },
              day_of_week: e.day,
              start_time: e.startTime,
              end_time: e.endTime,
              room: e.room,
              type: 'lecture'
            } as TimetableEntry
          })
          setTimetable(normalized)
        } else {
          setTimetable(rawEntries as TimetableEntry[])
        }
      } else {
        setError(response.message || "Failed to load timetable")
      }
    } catch (err: any) {
      console.error('Timetable error:', err)
      setError(err.response?.data?.message || "Network error occurred")
      toast.error("Failed to load timetable")
    } finally {
      setLoading(false)
    }
  }

  function groupByDay(entries: TimetableEntry[]) {
    const grouped: Record<string, TimetableEntry[]> = {}
    
    entries.forEach(entry => {
      if (!grouped[entry.day_of_week]) {
        grouped[entry.day_of_week] = []
      }
      grouped[entry.day_of_week].push(entry)
    })

    // Sort entries within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time))
    })

    return grouped
  }

  function getTypeColor(type: string) {
    switch (type.toLowerCase()) {
      case 'lecture':
        return 'bg-blue-600/10 border-blue-600/20 text-blue-400'
      case 'lab':
        return 'bg-purple-600/10 border-purple-600/20 text-purple-400'
      case 'tutorial':
        return 'bg-green-600/10 border-green-600/20 text-green-400'
      default:
        return 'bg-orange-600/10 border-orange-600/20 text-orange-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-12">
        <div>
          <Skeleton className="h-16 w-96 bg-slate-800/50 mb-4" />
          <Skeleton className="h-6 w-64 bg-slate-800/50" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 bg-slate-800/50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold text-slate-900 mb-3">Timetable</h1>
          <p className="text-xl text-slate-600">Your class schedule at a glance</p>
        </motion.div>

        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Unable to Load Timetable</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={loadTimetable}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const groupedTimetable = groupByDay(timetable)

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl font-bold text-slate-900 mb-3">Timetable</h1>
        <p className="text-xl text-slate-600">Your class schedule at a glance</p>
      </motion.div>

      {timetable.length === 0 ? (
        <EmptySection
          icon={Calendar}
          title="No schedule yet"
          description="Your class timetable will appear here once courses are scheduled"
        />
      ) : (
        <div className="space-y-6">
          {DAYS_ORDER.map((day, dayIndex) => {
            const dayEntries = groupedTimetable[day]
            if (!dayEntries || dayEntries.length === 0) return null

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: dayIndex * 0.1 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{day}</h2>
                <div className="space-y-3">
                  {dayEntries.map((entry, index) => (
                    <div
                      key={entry._id}
                      className="rounded-2xl bg-black/50 backdrop-blur-md border border-slate-700/50 p-6 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-orange-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900">
                                {entry.course_id.title}
                              </h3>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(entry.type)}`}>
                                {entry.type}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {entry.start_time} - {entry.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{entry.instructor_id.name}</span>
                            </div>
                            {entry.room && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{entry.room}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
