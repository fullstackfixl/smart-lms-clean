"use client"

import { useState, useEffect, use } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Building2, Mail, Phone, MapPin, Calendar, Users, RefreshCw } from "lucide-react"
import { platformApi } from "@/lib/api"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface Organization {
  _id: string
  name: string
  email: string
  phone?: string
  plan: 'basic' | 'premium'
  status: 'active' | 'suspended'
  slug: string
  code: string
  created_at: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  userCount?: number
  limits?: {
    maxUsers: number
    maxCourses: number
    maxStorage: number
  }
  usage?: {
    users: number
    courses: number
    storage: number
  }
}

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { token } = useAuth()
  const id = unwrappedParams.id

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    loadOrganization()
  }, [id])

  const loadOrganization = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await platformApi.getOrg(token, id)
      if (response.success && response.data) {
        setOrganization((response.data as any).organization)
      }
    } catch (error) {
      console.error("Failed to load organization:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!organization) return

    setActionLoading(true)
    try {
      const newStatus = organization.status === 'active' ? 'suspended' : 'active'
      const response = await platformApi.updateOrgStatus(id, newStatus)

      if (response.success) {
        await loadOrganization()
      } else {
        alert(response.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Failed to toggle status:", error)
      alert("Failed to update status")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const response = await platformApi.deleteOrg(id)

      if (response.success) {
        router.push('/platform/organizations')
      } else {
        alert(response.error || "Failed to delete organization")
      }
    } catch (error) {
      console.error("Failed to delete:", error)
      alert("Failed to delete organization")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Organization not found</h3>
          <button
            onClick={() => router.push('/platform/organizations')}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/platform/organizations')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-slate-800/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-50 mb-2">{organization.name}</h1>
            <p className="text-lg text-gray-400">Organization Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStatusToggle}
            disabled={actionLoading}
            className={`flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium shadow-lg transition-all hover:scale-105 ${organization.status === 'active'
                ? 'bg-red-600 text-white shadow-red-500/20 hover:bg-red-500'
                : 'bg-green-600 text-white shadow-green-500/20 hover:bg-green-500'
              }`}
          >
            {organization.status === 'active' ? (
              <>
                <XCircle className="h-5 w-5" />
                Suspend
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => router.push(`/platform/organizations/${id}/edit`)}
            className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:scale-105"
          >
            <Edit className="h-5 w-5" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-slate-800/50 px-6 text-sm font-medium text-gray-300 shadow-lg transition-all hover:bg-red-600 hover:text-white hover:scale-105"
          >
            <Trash2 className="h-5 w-5" />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${organization.status === 'active'
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
          {organization.status === 'active' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {organization.status.charAt(0).toUpperCase() + organization.status.slice(1)}
        </span>
      </motion.div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6"
        >
          <h2 className="text-xl font-bold text-gray-50 mb-6">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Organization Name</div>
                <div className="text-base text-gray-100 font-medium">{organization.name}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Email</div>
                <div className="text-base text-gray-100">{organization.email}</div>
              </div>
            </div>
            {organization.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-400">Phone</div>
                  <div className="text-base text-gray-100">{organization.phone}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Created</div>
                <div className="text-base text-gray-100">
                  {new Date(organization.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plan & Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6"
        >
          <h2 className="text-xl font-bold text-gray-50 mb-6">Plan & Access</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-2">Plan</div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${organization.plan === 'premium'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'bg-slate-800/50 text-gray-400 border border-slate-700/50'
                }`}>
                {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Organization Code</div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-indigo-400 font-mono text-sm border border-slate-700/50">
                  {organization.code}
                </code>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Slug</div>
              <code className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-gray-300 font-mono text-sm border border-slate-700/50">
                {organization.slug}
              </code>
            </div>
            {organization.userCount !== undefined && (
              <div className="flex items-start gap-3 pt-2">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-400">Total Users</div>
                  <div className="text-2xl text-gray-100 font-bold">{organization.userCount}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Address */}
      {organization.address && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6"
        >
          <h2 className="text-xl font-bold text-gray-50 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </h2>
          <div className="text-gray-300 space-y-1">
            {organization.address.street && <div>{organization.address.street}</div>}
            <div>
              {[organization.address.city, organization.address.state, organization.address.zipCode]
                .filter(Boolean)
                .join(', ')}
            </div>
            {organization.address.country && <div>{organization.address.country}</div>}
          </div>
        </motion.div>
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
              Are you sure you want to delete <strong>{organization.name}</strong>? This action can be undone later by restoring it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
