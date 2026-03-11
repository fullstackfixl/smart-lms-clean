"use client"

import { useEffect, useMemo, useState } from "react"
import { Book, Users, Clock, Search, RefreshCw } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { useAuth } from "../../../lib/auth-context"
import { instructorApi } from "../../../lib/api"
import { toast } from "sonner"

interface SubjectItem {
  _id: string
  name?: string
  title?: string
  code?: string
  credits?: number
  totalStudents?: number
  students?: number
  totalModules?: number
  modules?: number
}

export default function InstructorSubjectsPage() {
  const { token, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<SubjectItem[]>([])

  useEffect(() => {
    if (!token) return
    if (user?.organizationType && user.organizationType !== 'COLLEGE') return

    loadSubjects()
  }, [token, user])

  async function loadSubjects() {
    if (!token) return
    setLoading(true)
    try {
      const res = await instructorApi.listSubjects(token)
      if (res.success) {
        const payload: any = res.data
        const list: SubjectItem[] = payload?.subjects || payload || []
        setSubjects(Array.isArray(list) ? list : [])
      } else {
        toast.error("Failed to load subjects")
      }
    } catch (error) {
      toast.error("Error loading subjects")
    } finally {
      setLoading(false)
    }
  }

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      (s.name || s.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [subjects, searchQuery])

  const totalStudents = useMemo(() => 
    subjects.reduce((sum, s) => sum + (Number(s.totalStudents ?? s.students) || 0), 0),
    [subjects]
  )

  // Show empty state for non-college organizations
  if (user?.organizationType && user.organizationType !== 'COLLEGE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Book className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Subjects Not Available</h2>
        <p className="text-slate-500 mt-2">This feature is only available for college/institution accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Subjects</h1>
          <p className="text-slate-500 mt-1">View and manage your assigned academic subjects.</p>
        </div>
        <Button variant="outline" onClick={loadSubjects}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Total Subjects</p>
          <p className="text-2xl font-bold text-slate-900">{subjects.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Total Students</p>
          <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Credits</p>
          <p className="text-2xl font-bold text-slate-900">{subjects.reduce((sum, s) => sum + (s.credits || 0), 0)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full pl-10 pr-4 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Credits</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Students</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Modules</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
                  Loading subjects...
                </td>
              </tr>
            ) : filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <Book className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No subjects found.
                </td>
              </tr>
            ) : (
              filteredSubjects.map((subject) => (
                <tr key={subject._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {(subject.name || subject.title || "?").charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{subject.name || subject.title || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{subject.code || "-"}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{subject.credits || 0}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-orange-500" />
                      {Number(subject.totalStudents ?? subject.students ?? 0)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {Number(subject.totalModules ?? subject.modules ?? 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
