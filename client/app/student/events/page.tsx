"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CalendarDays, AlertCircle, Clock, MapPin, Users } from "lucide-react"
import { EmptySection } from '../../../components/student/EmptySection'
import { Skeleton } from '../../../components/ui/skeleton'
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { getEvents, registerForEvent } from '../../../lib/services/studentApi'
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"

interface Event {
  _id: string
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  location?: string
  event_type: string
  max_participants?: number
  registered_count?: number
  is_registered?: boolean
  organizer?: {
    name: string
  }
}

interface CollegeEventDto {
  _id: string
  title: string
  description?: string
  date: string
  endDate?: string
  location?: string
  eventType?: string
}

function toStudentEventFromCollege(e: CollegeEventDto): Event {
  const start = new Date(e.date)
  const end = e.endDate ? new Date(e.endDate) : null

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const toTime = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`

  return {
    _id: e._id,
    title: e.title,
    description: e.description || '',
    event_date: start.toISOString().slice(0, 10),
    start_time: toTime(start),
    end_time: end ? toTime(end) : toTime(new Date(start.getTime() + 60 * 60 * 1000)),
    location: e.location,
    event_type: e.eventType || 'other'
  }
}

export default function EventsPage() {
  const { token, organization } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    setError(null)
    try {
      if (isCollege) {
        if (!token) {
          setError('No authentication token')
          return
        }
        const response = await collegeApi.getStudentEvents(token)
        if (response.success) {
          const payload = response.data as any
          const eventsData = payload?.events || payload || []
          const normalized = Array.isArray(eventsData) ? eventsData.map(toStudentEventFromCollege) : []
          setEvents(normalized)
        } else {
          setError(response.message || 'Failed to load events')
        }
      } else {
        const response = await getEvents()

        if (response.success && response.data) {
          // The API returns an object containing the events array and pagination metadata
          const eventsData = response.data.events || []
          setEvents(Array.isArray(eventsData) ? eventsData : [])
        } else {
          setError(response.message || "Failed to load events")
        }
      }
    } catch (err: any) {
      console.error('Events error:', err)
      setError(err.response?.data?.message || "Network error occurred")
      toast.error("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(eventId: string) {
    setRegistering(eventId)
    try {
      const response = await registerForEvent(eventId)

      if (response.success) {
        toast.success("Successfully registered for event!")
        // Reload events to update registration status
        await loadEvents()
      } else {
        toast.error(response.message || "Failed to register for event")
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      toast.error(err.response?.data?.message || "Failed to register for event")
    } finally {
      setRegistering(null)
    }
  }

  function getEventTypeColor(type: string) {
    switch (type.toLowerCase()) {
      case 'workshop':
        return 'bg-purple-600/10 border-purple-600/20 text-purple-400'
      case 'webinar':
        return 'bg-blue-600/10 border-blue-600/20 text-blue-400'
      case 'seminar':
        return 'bg-green-600/10 border-green-600/20 text-green-400'
      case 'conference':
        return 'bg-orange-600/10 border-orange-600/20 text-orange-400'
      default:
        return 'bg-slate-600/10 border-slate-600/20 text-slate-400'
    }
  }

  function isEventPast(eventDate: string, endTime: string) {
    const eventDateTime = new Date(`${eventDate}T${endTime}`)
    return eventDateTime < new Date()
  }

  function isEventToday(eventDate: string) {
    const today = new Date().toDateString()
    const event = new Date(eventDate).toDateString()
    return today === event
  }

  if (loading) {
    return (
      <div className="space-y-12">
        <div>
          <Skeleton className="h-16 w-96 bg-slate-800/50 mb-4" />
          <Skeleton className="h-6 w-64 bg-slate-800/50" />
        </div>
        <div className="space-y-4">
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
          <h1 className="text-6xl font-bold text-white mb-3">Events</h1>
          <p className="text-xl text-slate-300">Upcoming workshops, webinars, and special sessions</p>
        </motion.div>

        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Events</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={loadEvents}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl font-bold text-white mb-3">Events</h1>
        <p className="text-xl text-slate-300">Upcoming workshops, webinars, and special sessions</p>
      </motion.div>

      {events.length === 0 ? (
        <EmptySection
          icon={CalendarDays}
          title="No upcoming events"
          description="Check back later for exciting events and workshops"
        />
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => {
            const isPast = isEventPast(event.event_date, event.end_time)
            const isToday = isEventToday(event.event_date)
            const isFull = !!(event.max_participants && (event.registered_count || 0) >= event.max_participants)

            return (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl bg-black/50 backdrop-blur-md border border-slate-700/50 p-6 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center">
                        <CalendarDays className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(event.event_type)}`}>
                            {event.event_type}
                          </span>
                          {isToday && (
                            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                              TODAY
                            </span>
                          )}
                          {event.is_registered && (
                            <span className="px-3 py-1 rounded-full bg-green-600/10 border border-green-600/20 text-green-400 text-xs font-semibold">
                              Registered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-slate-300 mb-4">{event.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {event.start_time} - {event.end_time}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.max_participants && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.registered_count || 0}/{event.max_participants} registered
                          </span>
                        </div>
                      )}
                    </div>

                    {event.organizer && (
                      <p className="text-sm text-slate-400 mt-3">
                        Organized by {event.organizer.name}
                      </p>
                    )}
                  </div>

                  <div>
                    {!isPast && !event.is_registered && (
                      <Button
                        onClick={() => handleRegister(event._id)}
                        disabled={registering === event._id || isFull}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3"
                      >
                        {registering === event._id ? 'Registering...' : isFull ? 'Event Full' : 'Register'}
                      </Button>
                    )}
                    {event.is_registered && !isPast && (
                      <div className="px-8 py-3 rounded-xl bg-green-600/10 border border-green-600/20 text-green-400 font-semibold text-center">
                        You're Registered
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
