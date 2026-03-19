"use client"

import { useEffect, useState } from "react"
import { GraduationCap, TrendingUp, Award, RefreshCw, BookOpen, FileText } from "lucide-react"
import { useAuth } from '../../../lib/auth-context'
import { collegeApi, submissionApi } from '../../../lib/api'
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"

interface Grade {
  _id: string
  subjectId?: { _id: string; name: string; code: string }
  course_id?: { _id: string; title: string }
  marks: number
  grade?: string
  credits?: number
  semester?: number
  exam_type?: string
  createdAt: string
}

interface AssignmentGrade {
  _id: string
  assignment_id?: { _id: string; title: string; max_score: number }
  course_id?: { _id: string; title: string }
  earned_score: number
  max_score: number
  percentage: number
  status: 'submitted' | 'graded'
  comments?: string
  submitted_at: string
  graded_at?: string
  type: 'assignment'
}

 interface GradesPayload {
   grades?: Grade[]
   gpa?: string
   summary?: {
     totalGrades?: number
     totalCredits?: number
     highestMarks?: number
     lowestMarks?: number
     averageMarks?: number
   }
 }

export default function GradesPage() {
  const { user, token } = useAuth()
  const [grades, setGrades] = useState<Grade[]>([])
  const [assignmentGrades, setAssignmentGrades] = useState<AssignmentGrade[]>([])
  const [gpa, setGpa] = useState('0.00')
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGrades()
  }, [token])

  async function loadGrades() {
    if (!token) return
    setLoading(true)
    try {
      // Load academic grades
      const [gradesRes, submissionsRes] = await Promise.all([
        collegeApi.getStudentGrades(token),
        submissionApi.list(token, 'limit=100')
      ])
      
      if (gradesRes.success) {
        const payload = (gradesRes.data || {}) as GradesPayload
        setGrades(payload.grades || [])
        setGpa(payload.gpa || '0.00')
        setSummary(payload.summary || null)
      }
      
      // Load graded assignment submissions
      if (submissionsRes.success) {
        const submissions = (submissionsRes.data as any)?.submissions || []
        const gradedAssignments = submissions
          .filter((s: any) => s.status === 'graded')
          .map((s: any) => ({
            _id: s._id,
            assignment_id: s.assignment_id,
            course_id: s.course_id,
            earned_score: s.earned_score || 0,
            max_score: s.assignment_id?.max_score || 100,
            percentage: s.earned_score && s.assignment_id?.max_score 
              ? (s.earned_score / s.assignment_id.max_score) * 100 
              : 0,
            status: s.status,
            comments: s.comments,
            submitted_at: s.submitted_at,
            graded_at: s.graded_at,
            type: 'assignment' as const
          }))
        setAssignmentGrades(gradedAssignments)
      }
    } catch (error) {
      toast.error("Failed to load grades")
    } finally {
      setLoading(false)
    }
  }

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-md animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Grades</h1>
          <p className="text-slate-500 mt-1">Track your academic performance</p>
        </div>
        <Button variant="outline" onClick={loadGrades} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* GPA Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Current GPA</p>
              <p className="text-3xl font-bold text-slate-900">{gpa}</p>
            </div>
            <div className="p-3 rounded-md bg-blue-50">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Subjects</p>
              <p className="text-3xl font-bold text-slate-900">{summary?.totalGrades || grades.length}</p>
            </div>
            <div className="p-3 rounded-md bg-green-50">
              <BookOpen className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Highest Marks</p>
              <p className="text-3xl font-bold text-slate-900">{summary?.highestMarks || 0}%</p>
            </div>
            <div className="p-3 rounded-md bg-orange-50">
              <Award className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Average Marks</p>
              <p className="text-3xl font-bold text-slate-900">{summary?.averageMarks || 0}%</p>
            </div>
            <div className="p-3 rounded-md bg-teal-50">
              <GraduationCap className="w-6 h-6 text-teal-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Grades Section */}
      {assignmentGrades.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Assignment Grades</h3>
              <p className="text-sm text-slate-500">Grades from your submitted assignments</p>
            </div>
          </div>
          
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Percentage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Comments</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Graded Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignmentGrades.map((grade) => (
                <tr key={grade._id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <p className="font-medium text-slate-900">
                        {grade.assignment_id?.title || 'Assignment'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {grade.course_id?.title || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">
                      {grade.earned_score} / {grade.max_score}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      grade.percentage >= 90 ? 'text-green-600' :
                      grade.percentage >= 80 ? 'text-blue-600' :
                      grade.percentage >= 70 ? 'text-orange-600' :
                      'text-slate-600'
                    }`}>
                      {grade.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm max-w-xs">
                    {grade.comments || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {grade.graded_at ? new Date(grade.graded_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grades Table */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Grade History</h3>
            <p className="text-sm text-slate-500">{isCollege ? 'All your subject grades' : 'All your course grades'}</p>
          </div>
        </div>
        
        {grades.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No grades available yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Exam Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {grades.map((grade, index) => (
                <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {grade.subjectId?.name || grade.course_id?.title || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-500">{grade.subjectId?.code || ''}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {grade.exam_type || 'Assignment'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {grade.semester || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      grade.marks >= 90 ? 'text-green-600' :
                      grade.marks >= 80 ? 'text-blue-600' :
                      grade.marks >= 70 ? 'text-orange-600' :
                      'text-slate-600'
                    }`}>
                      {grade.marks}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      grade.marks >= 90 ? 'bg-green-100 text-green-700' :
                      grade.marks >= 80 ? 'bg-blue-100 text-blue-700' :
                      grade.marks >= 70 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {grade.grade || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(grade.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
