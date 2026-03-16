"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Clock, Plus, Trash2, Search, Loader2, X, 
  BookOpen, Users, Building2, Calendar, RefreshCw
} from "lucide-react"
import { collegeApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface TimetableEntry {
  _id: string
  programId: { _id: string; name: string; code: string }
  batchId: { _id: string; name: string; code: string }
  subjectId: { _id: string; name: string; code: string }
  instructorId?: { _id: string; email: string; profile: { firstName: string; lastName: string } }
  day: string
  startTime: string
  endTime: string
  room: string
}

interface Program {
  _id: string
  name: string
  code: string
}

interface Batch {
  _id: string
  name: string
  code: string
}

interface Subject {
  _id: string
  name: string
  code: string
}

interface Instructor {
  _id: string
  name: string
  email: string
  profile?: {
    firstName?: string
    lastName?: string
  }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function TimetablePage() {
  const { token } = useAuth()
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedProgram, setSelectedProgram] = useState<string>('all')

  const [formData, setFormData] = useState({
    programId: '',
    batchId: '',
    subjectId: '',
    instructorId: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: ''
  })

  useEffect(() => {
    if (token) loadData()
  }, [token, selectedDay, selectedProgram])

  async function loadData() {
    setLoading(true)
    try {
      if (!token) return
      const params = new URLSearchParams()
      if (selectedDay !== 'all') params.append('day', selectedDay)
      if (selectedProgram !== 'all') params.append('programId', selectedProgram)

      console.log('[Timetable] Loading data...')
      const [timetableRes, programsRes, instructorsRes] = await Promise.all([
        collegeApi.listTimetable(token, params.toString()),
        collegeApi.listPrograms(token),
        collegeApi.listInstructors(token)
      ])

      console.log('[Timetable] listTimetable response:', timetableRes)
      if (timetableRes.success && timetableRes.data) {
        const payload = timetableRes.data as any
        // Try multiple data formats
        let entries = []
        if (payload?.entries && Array.isArray(payload.entries)) {
          entries = payload.entries
          console.log('[Timetable] Extracted from payload.entries:', entries.length)
        } else if (Array.isArray(payload)) {
          entries = payload
          console.log('[Timetable] Payload is array:', entries.length)
        } else if (payload?.data && Array.isArray(payload.data)) {
          entries = payload.data
          console.log('[Timetable] Extracted from payload.data:', entries.length)
        } else {
          console.log('[Timetable] No valid entries array found, payload:', payload)
        }
        setEntries(entries)
      }
      if (programsRes.success && programsRes.data) {
        const data = programsRes.data as { programs?: Program[] }
        setPrograms(data.programs || [])
      }
      if (instructorsRes.success && instructorsRes.data) {
        const data = instructorsRes.data as { instructors?: Instructor[] }
        setInstructors(data.instructors || [])
      }
    } catch (error) {
      console.error('Error loading timetable:', error)
      toast.error("Failed to load timetable")
    } finally {
      setLoading(false)
    }
  }

  async function loadBatchesAndSubjects(programId: string) {
    try {
      if (!token) return
      const programRes = await collegeApi.getProgram(token, programId)
      if (programRes.success && programRes.data) {
        const data = programRes.data as { subjects?: Subject[]; batches?: Batch[] }
        setSubjects(data.subjects || [])
        setBatches(data.batches || [])
      }
    } catch (error) {
      console.error('Error loading program details:', error)
    }
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!token) return
      const response = await collegeApi.createTimetableEntry(token, formData)
      console.log('[Timetable] Create response:', response)
      if (response.success) {
        toast.success("Timetable entry created successfully")
        setShowCreateModal(false)
        setFormData({
          programId: '',
          batchId: '',
          subjectId: '',
          instructorId: '',
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
          room: ''
        })
        // Optimistic update
        const newEntry = response.data?.entry || response.data
        if (newEntry) {
          console.log('[Timetable] Optimistically adding entry:', newEntry)
          setEntries(prev => [newEntry, ...prev])
        }
        // Reload after short delay
        setTimeout(() => loadData(), 500)
      }
    } catch (error) {
      console.error('Error creating timetable entry:', error)
      toast.error("Failed to create timetable entry")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteEntry(id: string) {
    try {
      if (!token) return
      await collegeApi.deleteTimetableEntry(token, id)
      toast.success("Timetable entry deleted")
      loadData()
    } catch (error) {
      console.error('Error deleting timetable entry:', error)
      toast.error("Failed to delete entry")
    }
  }

  const handleProgramChange = (programId: string) => {
    setFormData({ ...formData, programId, batchId: '', subjectId: '' })
    if (programId) loadBatchesAndSubjects(programId)
  }

  const filteredEntries = selectedDay === 'all' 
    ? entries 
    : entries.filter(e => e.day === selectedDay)

  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = filteredEntries.filter(e => e.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
    return acc
  }, {} as Record<string, TimetableEntry[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
          <p className="text-slate-500 mt-1">Manage class schedules for all programs.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4 stroke-[1.5]" />
            Add Schedule
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Filter by Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Days</option>
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Filter by Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Programs</option>
              {programs.map(program => (
                <option key={program._id} value={program._id}>{program.name} ({program.code})</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Timetable Grid */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-md">
          <Clock className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No timetable entries found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS.map((day) => (
            <div key={day} className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className={`p-3 text-center font-semibold text-sm ${selectedDay === day ? 'bg-blue-600 text-white' : 'bg-gray-50 text-slate-700'}`}>
                {day.slice(0, 3)}
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {groupedByDay[day]?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No classes</p>
                ) : (
                  groupedByDay[day]?.map((entry) => (
                    <div key={entry._id} className="bg-white rounded-md p-2 border border-gray-200 group hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-blue-600 font-semibold">{entry.subjectId?.code}</span>
                        <button
                          onClick={() => handleDeleteEntry(entry._id)}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1">{entry.subjectId?.name}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{entry.startTime} - {entry.endTime}</p>
                      <p className="text-[10px] text-slate-500">Room: {entry.room}</p>
                      <p className="text-[10px] text-blue-600 mt-1">
                        👤 {entry.instructorId?.profile?.firstName && entry.instructorId?.profile?.lastName 
                          ? `${entry.instructorId.profile.firstName} ${entry.instructorId.profile.lastName}`
                          : entry.instructorId?.email || 'No Instructor'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white border border-gray-200 rounded-md p-6 w-full max-w-md shadow-2xl"
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Timetable Entry</h3>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Program</label>
                <select
                  value={formData.programId}
                  onChange={(e) => handleProgramChange(e.target.value)}
                  required
                  className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select Program</option>
                  {programs.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Batch</label>
                <select
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  required
                  className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select Batch</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  required
                  className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Instructor</label>
                <select
                  value={formData.instructorId}
                  onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  required
                  className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map(inst => (
                    <option key={inst._id} value={inst._id}>
                      {inst.profile?.firstName && inst.profile?.lastName 
                        ? `${inst.profile.firstName} ${inst.profile.lastName}`
                        : inst.name || inst.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Day</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Room</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., Room 101"
                  required
                  className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Entry"}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
