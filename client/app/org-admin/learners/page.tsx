"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  School,
  CheckCircle,
  XCircle,
  BookOpen,
} from "lucide-react"

import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import { API_URL } from "../../../lib/config"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"

interface Learner {
  _id: string
  firstName: string
  lastName: string
  email: string
  rollNumber?: string
  departmentId?: { _id: string; name: string }
  programId?: { _id: string; name: string }
  batchId?: { _id: string; name: string }
  semester?: number
  enrolledSubjects?: string[]
  enrolledCourses?: string[]
  status: "active" | "inactive" | "suspended"
  createdAt: string
}

interface FilterState {
  program: string
  batch: string
  department: string
  semester: string
  status: string
}

export default function LearnersPage() {
  const { token, organization } = useAuth()
  const router = useRouter()
  const [learners, setLearners] = useState<Learner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    program: "",
    batch: "",
    department: "",
    semester: "",
    status: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null)
  const [showAssignBatchModal, setShowAssignBatchModal] = useState(false)

  const [programs, setPrograms] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    if (token) {
      loadLearners()
      loadFilterData()
    }
  }, [token])

  async function loadLearners() {
    setLoading(true)
    try {
      const response = await collegeApi.listStudents(token!)
      console.log("[Learners] API response:", response)
      if (response.success) {
        const data = response.data as any
        let students = []
        if (Array.isArray(data)) {
          students = data
        } else if (data?.students && Array.isArray(data.students)) {
          students = data.students
        } else if (data?.data && Array.isArray(data.data)) {
          students = data.data
        }
        console.log("[Learners] Parsed students:", students.length)
        setLearners(students)
      } else {
        console.error("[Learners] API error:", response.error)
        toast.error(response.error || "Failed to load learners")
      }
    } catch (err) {
      console.error("[Learners] Error loading learners:", err)
      toast.error("Failed to load learners")
    } finally {
      setLoading(false)
    }
  }

  async function loadFilterData() {
    try {
      const [progRes, batchRes, deptRes] = await Promise.all([
        collegeApi.listPrograms(token!),
        collegeApi.listBatches(token!),
        collegeApi.listDepartments(token!),
      ])

      if (progRes.success) {
        const d = progRes.data as any
        const list = (d?.programs ?? d?.data ?? d)
        setPrograms(Array.isArray(list) ? list : [])
      }
      if (batchRes.success) {
        const d = batchRes.data as any
        const list = (d?.batches ?? d?.data ?? d)
        setBatches(Array.isArray(list) ? list : [])
      }
      if (deptRes.success) {
        const d = deptRes.data as any
        const list = (d?.departments ?? d?.data ?? d)
        setDepartments(Array.isArray(list) ? list : [])
      }
    } catch (err) {
      console.error("Error loading filter data:", err)
    }
  }

  const filteredLearners = learners.filter((learner) => {
    const fullName = `${learner.firstName || ""} ${learner.lastName || ""}`.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      fullName.includes(searchTerm.toLowerCase()) ||
      learner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learner.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProgram = !filters.program || learner.programId?._id === filters.program
    const matchesBatch = !filters.batch || learner.batchId?._id === filters.batch
    const matchesDepartment = !filters.department || learner.departmentId?._id === filters.department
    const matchesSemester = !filters.semester || learner.semester === parseInt(filters.semester)
    const matchesStatus = !filters.status || learner.status === filters.status

    return matchesSearch && matchesProgram && matchesBatch && matchesDepartment && matchesSemester && matchesStatus
  })

  async function handleAssignBatch(learnerId: string, data: { programId: string; batchId: string }) {
    try {
      const response = await collegeApi.assignLearnerToProgramBatch(token!, {
        studentId: learnerId,
        programId: data.programId,
        batchId: data.batchId
      })

      if (response.success) {
        toast.success("Student assigned successfully")
        loadLearners()
        setShowAssignBatchModal(false)
      } else {
        toast.error(response.error || "Failed to assign student")
      }
    } catch (err) {
      console.error("Error assigning batch:", err)
      toast.error("Failed to assign student")
    }
  }

  async function handleStatusChange(learnerId: string, status: string) {
    try {
      const response = await fetch(`${API_URL}/api/college/admin/learners/${learnerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success(`Status updated to ${status}`)
        loadLearners()
      } else {
        toast.error("Failed to update status")
      }
    } catch (err) {
      console.error("Error updating status:", err)
      toast.error("Failed to update status")
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      active: "bg-green-100 text-green-700 border-green-200",
      inactive: "bg-gray-100 text-gray-700 border-gray-200",
      suspended: "bg-red-100 text-red-700 border-red-200",
    }
    return (
      <span className={cn("px-2 py-1 text-xs font-medium rounded border", styles[status as keyof typeof styles])}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading learners...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <Users className="w-3.5 h-3.5" />
            Student Management
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Learners</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all students in your organization</p>
        </div>
        <Button
          onClick={() => router.push("/org-admin/learners/new")}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Learner
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn("border-gray-200", showFilters && "bg-blue-50 text-blue-600 border-blue-200")}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Program</label>
            <select
              value={filters.program}
              onChange={(e) => setFilters({ ...filters, program: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Programs</option>
              {programs?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Batch</label>
            <select
              value={filters.batch}
              onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Batches</option>
              {batches?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Departments</option>
              {departments?.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Semester</label>
            <select
              value={filters.semester}
              onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1.5 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Total Learners</p>
          <p className="text-2xl font-bold text-slate-900">{learners.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{learners.filter((l) => l.status === "active").length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Assigned to Batch</p>
          <p className="text-2xl font-bold text-blue-600">{learners.filter((l) => l.batchId).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Roll Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Semester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-slate-900 font-medium mb-1">No learners found</p>
                      <p className="text-sm text-slate-500">Add your first learner to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner) => (
                  <tr key={learner._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {learner.firstName?.charAt(0)}
                          {learner.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {learner.firstName} {learner.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{learner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{learner.rollNumber || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{learner.programId?.name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{learner.batchId?.name || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {learner.semester ? `Semester ${learner.semester}` : "-"}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(learner.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedLearner(learner)
                            setShowAssignBatchModal(true)
                          }}
                          title="Assign Program & Batch"
                        >
                          <School className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                          onClick={() => router.push(`/org-admin/learners/${learner._id}`)}
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100"
                          onClick={() => router.push(`/org-admin/learners/${learner._id}/edit`)}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Batch Modal */}
      {showAssignBatchModal && selectedLearner && (
        <AssignBatchModal
          learner={selectedLearner}
          programs={programs}
          batches={batches}
          onClose={() => setShowAssignBatchModal(false)}
          onAssign={handleAssignBatch}
          initialProgramId={selectedLearner.programId?._id || ''}
          initialBatchId={selectedLearner.batchId?._id || ''}
        />
      )}
    </div>
  )
}

// Assign Batch Modal Component
function AssignBatchModal({
  learner,
  programs = [],
  batches = [],
  onClose,
  onAssign,
  initialProgramId,
  initialBatchId,
}: {
  learner: Learner
  programs?: any[]
  batches?: any[]
  onClose: () => void
  onAssign: (learnerId: string, data: any) => void
  initialProgramId?: string
  initialBatchId?: string
}) {
  const safePrograms = Array.isArray(programs) ? programs : []
  const safeBatches = Array.isArray(batches) ? batches : []

  const [selectedProgram, setSelectedProgram] = useState(initialProgramId || "")
  const [selectedBatch, setSelectedBatch] = useState(initialBatchId || "")

  const filteredBatches = safeBatches.filter((b) => {
    const batchProgramId = typeof b.programId === 'string' ? b.programId : b.programId?._id
    if (!selectedProgram) return true
    return String(batchProgramId) === String(selectedProgram)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-900">Assign Program & Batch</h3>
          <p className="text-sm text-slate-500">
            Assign {learner.firstName} {learner.lastName} to a batch
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select Program</option>
              {safePrograms.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select Batch</option>
              {filteredBatches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() =>
              onAssign(learner._id, {
                programId: selectedProgram,
                batchId: selectedBatch,
              })
            }
            disabled={!selectedProgram || !selectedBatch}
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  )
}
