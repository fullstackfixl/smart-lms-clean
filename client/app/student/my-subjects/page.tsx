"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Search, Filter, Clock, Calendar, ChevronRight, FileText, PlayCircle } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import { Button } from "../../../components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

interface Subject {
  _id: string
  name: string
  code: string
  description?: string
  credits?: number
  instructor?: {
    name: string
    email?: string
  }
  semester?: number
  year?: number
  programId?: string
  batchId?: string
}

export default function StudentMySubjectsPage() {
  const { user, token } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [semesterFilter, setSemesterFilter] = useState("all")

  // Get student batch info - backend stores in profile.batch, profile.program_id, profile.current_semester
  const studentBatchId = user?.profile?.batch
  const studentProgramId = user?.profile?.program_id || user?.profile?.program
  const studentSemester = user?.profile?.current_semester || user?.profile?.semester || 1

  useEffect(() => {
    loadSubjects()
  }, [token])

  useEffect(() => {
    filterSubjects()
  }, [subjects, searchQuery, semesterFilter])

  async function loadSubjects() {
    if (!token) return
    try {
      setLoading(true)
      // Use collegeApi to get subjects for the student's batch
      const res = await collegeApi.getMySubjects(token)
      if (res.success) {
        const allSubjects = (res.data as any)?.subjects || []
        // Filter subjects by student's batch - backend already filters, but we double-check
        // The student's batchId is stored as a string in profile.batch
        const studentBatchId = user?.profile?.batch
        const studentProgramId = user?.profile?.program_id || user?.profile?.program
        
        const relevantSubjects = allSubjects.filter((subject: any) => {
          // Match by batchId if available (subject.batchId might be string or object)
          const subjectBatchId = typeof subject.batchId === 'string' ? subject.batchId : subject.batchId?._id?.toString()
          const subjectProgramId = typeof subject.programId === 'string' ? subject.programId : subject.programId?._id?.toString()
          
          if (studentBatchId && subjectBatchId === studentBatchId) return true
          // Match by programId if available
          if (studentProgramId && subjectProgramId === studentProgramId) return true
          // If no batch/program filtering, show all (fallback)
          return true
        })
        setSubjects(relevantSubjects)
      }
    } catch (error) {
      toast.error("Failed to load subjects")
    } finally {
      setLoading(false)
    }
  }

  function filterSubjects() {
    let filtered = subjects

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (subject) =>
          subject.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply semester filter
    if (semesterFilter !== "all") {
      filtered = filtered.filter((subject) => subject.semester === parseInt(semesterFilter))
    }

    setFilteredSubjects(filtered)
  }

  // Group subjects by semester
  const subjectsBySemester = filteredSubjects.reduce((acc, subject) => {
    const sem = subject.semester || 1
    if (!acc[sem]) acc[sem] = []
    acc[sem].push(subject)
    return acc
  }, {} as Record<number, Subject[]>)

  const semesters = Object.keys(subjectsBySemester).sort((a, b) => parseInt(a) - parseInt(b))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Subjects</h1>
          <p className="text-slate-500 mt-1">
            {studentBatchId && typeof studentBatchId === 'string' && `Batch: ${studentBatchId.substring(0, 8)}...`}
            {studentProgramId && typeof studentProgramId === 'string' && ` • Program: ${studentProgramId.substring(0, 8)}...`}
            {studentSemester && ` • Current Semester: ${studentSemester}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No subjects found for your batch</p>
          <p className="text-sm text-slate-400 mt-2">
            Subjects will appear here once assigned to your batch
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {semesters.map((semester) => (
            <div key={semester}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Semester {semester}
                <span className="text-sm font-normal text-slate-500">
                  ({subjectsBySemester[parseInt(semester)].length} subjects)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectsBySemester[parseInt(semester)].map((subject, index) => (
                  <motion.div
                    key={subject._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow group"
                  >
                    {/* Subject Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {subject.code?.substring(0, 2) || "S"}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-500 bg-gray-100 px-2 py-1 rounded">
                          {subject.credits || 4} Credits
                        </span>
                      </div>
                    </div>

                    {/* Subject Info */}
                    <h3 className="font-semibold text-slate-900 mb-1">{subject.name}</h3>
                    <p className="text-sm text-slate-500 mb-1">{subject.code}</p>
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {subject.description || "No description available"}
                    </p>

                    {/* Instructor */}
                    {subject.instructor && (
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                          {subject.instructor.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-slate-600">{subject.instructor.name}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/student/subjects/${subject._id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50">
                          <FileText className="w-4 h-4 mr-2" />
                          Materials
                        </Button>
                      </Link>
                      <Link href={`/student/subjects/${subject._id}/live`} className="flex-1">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Join
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
