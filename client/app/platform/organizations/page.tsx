"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building2, Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, XCircle, RefreshCw, MoreVertical, Clock, Copy, Check } from "lucide-react"
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
        setOrganizations((response.data as any).organizations || [])
        if ((response.data as any).pagination) {
          setTotalPages((response.data as any).pagination.totalPages || 1)
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
    setActionLoading(id)
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
      const response = await platformApi.updateOrgStatus(id, newStatus)

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
    setActionLoading(id)
    try {
      const response = await platformApi.deleteOrg(id)

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
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-50 mb-2">Organizations</h1>
          <p className="text-lg text-gray-400">Manage all platform organizations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:scale-105"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
          Add Organization
        </button>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6">
            <div className="text-sm text-gray-400 mb-1">Total Organizations</div>
            <div className="text-3xl font-bold text-gray-50">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6">
            <div className="text-sm text-gray-400 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-400">{stats.active}</div>
          </div>
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6">
            <div className="text-sm text-gray-400 mb-1">Suspended</div>
            <div className="text-3xl font-bold text-red-400">{stats.suspended}</div>
          </div>
          <div className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6">
            <div className="text-sm text-gray-400 mb-1">Premium Plans</div>
            <div className="text-3xl font-bold text-indigo-400">{stats.byPlan.premium}</div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20"
      >
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-800/50 bg-slate-900/50 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Plans</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </motion.div>

      {/* Organizations Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm shadow-lg shadow-black/20 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Building2 className="mx-auto h-16 w-16 text-gray-600 mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No organizations found</h3>
              <p className="text-gray-500">Create your first organization to get started</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {organizations.map((org) => (
                  <tr key={org._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-100">{org.name}</div>
                        <div className="text-xs text-gray-500">{org.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800/50 text-gray-300">
                        {org.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${org.plan === 'premium'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'bg-slate-800/50 text-gray-400'
                        }`}>
                        {(org.plan ? org.plan.charAt(0).toUpperCase() + org.plan.slice(1) : 'Standard')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(org._id, org.status)}
                        disabled={actionLoading === org._id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors ${org.status === 'active'
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          : org.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 shadow-lg shadow-amber-500/5'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                      >
                        {org.status === 'active' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : org.status === 'pending' ? (
                          <Clock className="h-3 w-3 animate-pulse" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {(org.status ? org.status.charAt(0).toUpperCase() + org.status.slice(1) : 'Unknown')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/platform/organizations/${org._id}`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-slate-800/50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/platform/organizations/${org._id}/edit`)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-slate-800/50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(org._id)}
                          disabled={actionLoading === org._id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-slate-800/50 transition-colors"
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
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>

      {/* Create Modal */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-xl border border-slate-800/50 p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-50 mb-4">Confirm Delete</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this organization? This action can be undone later by restoring it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={actionLoading === showDeleteModal}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {actionLoading === showDeleteModal ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
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

  if (successData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 rounded-xl border border-slate-800/50 p-8 max-w-md w-full mx-4"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-50">Organization Created</h3>
            <p className="text-gray-400 mt-2">
              {successData.emailSent
                ? "The invitation email has been sent to the administrator."
                : "The organization was created, but the invitation email could not be sent."}
            </p>
          </div>

          {!successData.emailSent && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400 font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Action Required
                </p>
                <p className="text-xs text-amber-200/70">
                  Please copy the setup link below and share it with the administrator manually.
                </p>
              </div>

              <div className="relative group">
                <input
                  readOnly
                  value={successData.setupLink}
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 pr-12 text-xs text-indigo-400 font-mono focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-800 rounded-lg text-gray-400 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onSuccess()
              onClose()
            }}
            className="w-full mt-8 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            Done
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-xl border border-slate-800/50 p-6 max-w-md w-full mx-4 my-8"
      >
        <h3 className="text-2xl font-bold text-gray-50 mb-6">Create New Organization</h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={formData.orgName}
              onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Enter organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Organization Type *
            </label>
            <select
              value={formData.orgType}
              onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="SCHOOL">School</option>
              <option value="COLLEGE">College</option>
              <option value="INSTITUTE">Institute</option>
              <option value="ONLINE_ACADEMY">Online Academy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Name *
            </label>
            <input
              type="text"
              required
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Enter admin name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin Email *
            </label>
            <input
              type="email"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="admin@organization.com"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending Invitation..." : "Create & Send Invite"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
