"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"
import { platformApi } from '../../../../../lib/api'
import { useRouter, useParams } from "next/navigation"
import { useAuth } from '../../../../../lib/auth-context'

interface Organization {
  _id: string
  name: string
  email: string
  phone?: string
  plan: 'basic' | 'premium'
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
}

export default function EditOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuth()
  const id = params.id as string

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "basic" as 'basic' | 'premium',
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: ""
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadOrganization()
  }, [id])

  const loadOrganization = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await platformApi.getOrg(token, id)
      if (response.success && response.data) {
        const org = (response.data as any).organization
        setFormData({
          name: org.name || "",
          email: org.email || "",
          phone: org.phone || "",
          plan: org.plan || "basic",
          address: {
            street: org.address?.street || "",
            city: org.address?.city || "",
            state: org.address?.state || "",
            country: org.address?.country || "",
            zipCode: org.address?.zipCode || ""
          }
        })
      }
    } catch (error) {
      console.error("Failed to load organization:", error)
      setError("Failed to load organization")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await platformApi.updateOrg(id, formData)
      
      if (response.success) {
        router.push(`/platform/organizations/${id}`)
      } else {
        setError(response.error || "Failed to update organization")
      }
    } catch (err) {
      setError("An error occurred while updating the organization")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => router.push(`/platform/organizations/${id}`)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-slate-800/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-gray-50 mb-2">Edit Organization</h1>
          <p className="text-lg text-gray-400">Update organization details</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20"
      >
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="contact@organization.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="+1-555-0123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plan
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as 'basic' | 'premium' })}
                className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-800/50 pt-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Address Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                    className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="CA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                    className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="94102"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                  className="w-full h-11 rounded-xl border border-slate-800/50 bg-slate-900/50 px-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-slate-800/50">
            <button
              type="button"
              onClick={() => router.push(`/platform/organizations/${id}`)}
              className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
