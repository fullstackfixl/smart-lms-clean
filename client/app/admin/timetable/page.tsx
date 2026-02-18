"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Plus, Trash2, Clock } from "lucide-react"
import { timetableApi, adminApi } from "@/lib/api"
import { toast } from "sonner"

export default function TimetablePage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    course_id: "",
    day: "Monday",
    start_time: "",
    end_time: "",
    room: ""
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin' && user.organization_id) {
      fetchTimetable()
      fetchCourses()
    }
  }, [token, user])

  const fetchTimetable = async () => {
    if (!token || !user?.organization_id) return
    
    setLoadingData(true)
    try {
      const res = await timetableApi.getOrg(token, user.organization_id)
      if (res.success && res.data) {
        setEntries(Array.isArray(res.data) ? res.data : [])
      }
    } catch (error) {
      console.error('Failed to fetch timetable:', error)
      toast.error('Failed to load timetable')
    } finally {
      setLoadingData(false)
    }
  }

  const fetchCourses = async () => {
    if (!token) return
    
    try {
      const res = await adminApi.listCourses(token)
      if (res.success && res.data) {
        setCourses((res.data as any).courses || [])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const handleCreateEntry = async () => {
    if (!token) return
    
    if (!newEntry.course_id || !newEntry.start_time || !newEntry.end_time) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await timetableApi.create(token, newEntry)
      if (res.success) {
        toast.success('Timetable entry created')
        setIsCreateDialogOpen(false)
        setNewEntry({ course_id: "", day: "Monday", start_time: "", end_time: "", room: "" })
        fetchTimetable()
      } else {
        toast.error(res.error || 'Failed to create entry')
      }
    } catch (error) {
      toast.error('Failed to create entry')
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!token) return
    if (!confirm('Delete this timetable entry?')) return
    
    try {
      const res = await timetableApi.delete(token, entryId)
      if (res.success) {
        toast.success('Entry deleted')
        fetchTimetable()
      } else {
        toast.error('Failed to delete entry')
      }
    } catch (error) {
      toast.error('Failed to delete entry')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const groupedEntries = days.map(day => ({
    day,
    entries: entries.filter((e: any) => e.day === day)
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground">Manage class schedules</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Timetable Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Course *</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={newEntry.course_id}
                  onChange={(e) => setNewEntry({ ...newEntry, course_id: e.target.value })}
                >
                  <option value="">Select Course</option>
                  {courses.map((c: any) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Day *</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={newEntry.day}
                  onChange={(e) => setNewEntry({ ...newEntry, day: e.target.value })}
                >
                  {days.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={newEntry.start_time}
                  onChange={(e) => setNewEntry({ ...newEntry, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={newEntry.end_time}
                  onChange={(e) => setNewEntry({ ...newEntry, end_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Room</Label>
                <Input
                  value={newEntry.room}
                  onChange={(e) => setNewEntry({ ...newEntry, room: e.target.value })}
                  placeholder="Room 101"
                />
              </div>
              <Button onClick={handleCreateEntry} className="w-full">Create Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timetable Grid */}
      <div className="grid gap-4">
        {loadingData ? (
          <div className="text-center py-8">Loading timetable...</div>
        ) : (
          groupedEntries.map(({ day, entries: dayEntries }) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {dayEntries.map((entry: any) => (
                      <div key={entry._id || entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{entry.course_id?.title || 'N/A'}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {entry.start_time} - {entry.end_time}
                            </span>
                            {entry.room && <span>Room: {entry.room}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEntry(entry._id || entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
