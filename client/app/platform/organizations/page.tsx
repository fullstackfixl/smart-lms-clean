"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  MoreVertical, 
  Clock, 
  Copy, 
  Check,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import { platformApi } from '../../../lib/api'
import { useRouter } from "next/navigation"
import { useAuth } from '../../../lib/auth-context'

interface Organization {
  _id: string
  name: string
  email: string
  phone?: string
  plan: 'basic' | 'premium'
  status: 'active' | 'suspended' | 'pending'
  slug: string
  code: string
  created_at: string
  is_deleted?: boolean
}

interface Stats {
  total: number
  active: number
  suspended: number
  byPlan: {
    basic: number
    premium: number
  }
}

export default function OrganizationsPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [planFilter, setPlanFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadOrganizations()
      loadStats()
    }
  }, [currentPage, statusFilter, planFilter, searchTerm, token])

  const loadOrganizations = async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await platformApi.listOrgs(token, {
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        plan: planFilter || undefined,
        search: searchTerm || undefined,
      })

      if (response.success && response.data) {
        const data = response.data as any
        setOrganizations(data.organizations || [])
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1)
        }
      }
    } catch (error) {
      console.error("Failed to load organizations:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!token) return

    try {
      const response = await platformApi.getOrgStats(token)
      if (response.success && response.data) {
        setStats((response.data as any).stats)
      }
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    if (!token) return
    setActionLoading(id)
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
      const response = await platformApi.updateOrgStatus(token, id, newStatus)

      if (response.success) {
        await loadOrganizations()
        await loadStats()
      } else {
        alert(response.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)
      alert("Failed to update status")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    setActionLoading(id)
    try {
      const response = await platformApi.deleteOrg(token, id)

      if (response.success) {
        setShowDeleteModal(null)
        await loadOrganizations()
        await loadStats()
      } else {
        alert(response.error || "Failed to delete organization")
      }
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete organization")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organizations</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Manage and monitor all institutional partners on your platform.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-[13px] font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create Organization
        </button>
      </div>

      {/* Stats Quick View */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <QuickStat label="Total Institutions" value={stats.total} color="blue" />
          <QuickStat label="Active Partners" value={stats.active} color="emerald" />
          <QuickStat label="Premium Accounts" value={stats.byPlan.premium} color="indigo" />
          <QuickStat label="Suspended" value={stats.suspended} color="red" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
            <input
              type="text"
              placeholder="Search by name, code or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 placeholder-slate-400 transition-all focus:border-[#2563EB]/30 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5 font-medium"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5 transition-all outline-none min-w-[130px]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5 transition-all outline-none min-w-[130px]"
            >
              <option value="">All Plans</option>
              <option value="basic">Basic (Standard)</option>
              <option value="premium">Premium (Plus)</option>
            </select>
            <button 
              onClick={loadOrganizations}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#2563EB] hover:bg-slate-50 hover:border-[#2563EB]/20 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Organizations Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <RefreshCw className="h-8 w-8 text-[#2563EB] animate-spin opacity-50" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                <Building2 className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-[17px] font-bold text-slate-900 mb-1">No organizations found</h3>
              <p className="text-[13px] text-slate-500 max-w-xs">No institutions match your current search or filter criteria.</p>
              {(searchTerm || statusFilter || planFilter) && (
                <button 
                  onClick={() => {setSearchTerm(""); setStatusFilter(""); setPlanFilter("");}}
                  className="mt-6 text-[13px] font-bold text-[#2563EB] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Organization</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tier</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Connected</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-[#2563EB]/5 group-hover:text-[#2563EB] transition-colors">
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">{org.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{org.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200/50">
                        {org.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-sm border ${
                        org.plan === 'premium' 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}>
                        {org.plan === 'premium' ? '⚡ Premium' : 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(org._id, org.status)}
                        disabled={actionLoading === org._id}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                          org.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                            : org.status === 'pending'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                        }`}
                      >
                        {actionLoading === org._id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : org.status === 'active' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : org.status === 'pending' ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span className="capitalize">{org.status}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[12px] text-slate-500 font-medium">
                      {new Date(org.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/platform/organizations/${org._id}`)}
                          className="p-2 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/platform/organizations/${org._id}/edit`)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(org._id)}
                          disabled={actionLoading === org._id}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Improved Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[12px] text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateOrganizationModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              loadOrganizations()
              loadStats()
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 mx-auto">
                <ShieldAlert className="h-8 w-8 text-red-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Confirm Deletion</h3>
              <p className="text-[13px] text-slate-500 text-center mb-8 leading-relaxed">
                You are about to archive this organization. All data will remain secure but access will be restricted immediately.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={actionLoading === showDeleteModal}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[14px] font-bold transition-all shadow-md shadow-red-200 disabled:opacity-50"
                >
                  {actionLoading === showDeleteModal ? "Processing..." : "Archive Institution"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="w-full h-11 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[14px] font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function QuickStat({ label, value, color }: any) {
  const colors: any = {
    blue: "text-[#2563EB]",
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    red: "text-red-500",
  }
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${colors[color]} tracking-tighter`}>{value}</p>
    </div>
  )
}

function CreateOrganizationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuth()
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "SCHOOL",
    adminName: "",
    adminEmail: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successData, setSuccessData] = useState<{ setupLink: string; emailSent: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    setError("")

    try {
      const response = await platformApi.createOrgV2(token, formData)

      if (response.success) {
        setSuccessData({
          setupLink: (response.data as any).setupLink,
          emailSent: (response.data as any).emailSent
        })
      } else {
        setError(response.error || "Failed to create organization")
      }
    } catch (err) {
      setError("An error occurred while creating the organization")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (successData?.setupLink) {
      navigator.clipboard.writeText(successData.setupLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl p-0 max-w-lg w-full border border-slate-100 overflow-hidden"
      >
        {!successData ? (
          <>
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">New Institution</h3>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">Initialize a new organization environment.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-tighter">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[13px] font-medium text-slate-900 focus:bg-white focus:border-[#2563EB]/40 outline-none transition-all"
                    placeholder="Grand University"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-tighter">
                    Type
                  </label>
                  <select
                    value={formData.orgType}
                    onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[13px] font-bold text-slate-900 focus:bg-white focus:border-[#2563EB]/40 outline-none transition-all"
                  >
                    <option value="SCHOOL">School</option>
                    <option value="COLLEGE">College / University</option>
                    <option value="INSTITUTE">Institute</option>
                    <option value="ONLINE_ACADEMY">Online Academy</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-tighter">
                  Primary Administrator
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[13px] font-medium text-slate-900 focus:bg-white focus:border-[#2563EB]/40 outline-none transition-all"
                    placeholder="Full Name"
                  />
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[13px] font-medium text-slate-900 focus:bg-white focus:border-[#2563EB]/40 outline-none transition-all"
                    placeholder="admin@email.com"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 text-[14px] font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-3 h-12 bg-[#2563EB] text-white rounded-xl text-[14px] font-bold hover:bg-[#1d4ed8] shadow-lg shadow-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2 px-8"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
                  Create & Send Invitation
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Operation Successful</h3>
            <p className="text-[14px] text-slate-500 font-medium mb-8">
              {successData.emailSent
                ? "Institution created and secure invite sent to administrator."
                : "Created, but could not dispatch email. Please use manual link."}
            </p>

            <div className="space-y-4">
              <div className="relative group">
                <input
                  readOnly
                  value={successData.setupLink}
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-14 text-[12px] text-[#2563EB] font-bold font-mono focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 hover:bg-white rounded-lg text-slate-400 hover:text-[#2563EB] border border-transparent hover:border-slate-100 shadow-sm transition-all"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Setup Configuration URL</p>
            </div>

            <button
              onClick={() => {
                onSuccess()
                onClose()
              }}
              className="w-full mt-12 h-12 bg-[#2563EB] text-white rounded-xl text-[14px] font-bold hover:bg-[#1d4ed8] shadow-lg shadow-blue-100 transition-all"
            >
              Back to Overview
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

