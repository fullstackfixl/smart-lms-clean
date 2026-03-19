"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, CalendarClock, CheckCircle2, Mail, Phone, Search, UserCheck, XCircle } from "lucide-react"
import { toast } from "sonner"

import { platformApi } from "../../lib/api"
import { API_URL, getToken } from "../../lib/config"

type Mode = "admin" | "staff"

type ApplicationRecord = {
  _id: string
  organization_name: string
  organization_type: string
  contact_person_name: string
  contact_email: string
  contact_phone: string
  country: string
  state: string
  city: string
  expected_users: number
  message?: string
  status: string
  contact_notes?: string
  follow_up_date?: string | null
  created_at: string
  assigned_to?: {
    name?: string
    email?: string
  } | null
}

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Contacted", value: "contacted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Account Created", value: "account_created" },
]

const assignmentOptions = [
  { label: "All", value: "all" },
  { label: "Mine", value: "mine" },
  { label: "Unassigned", value: "unassigned" },
]

function statusBadge(status: string) {
  switch (status) {
    case "approved":
    case "account_created":
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "contacted":
      return "bg-sky-50 text-sky-700 border-sky-200"
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200"
    default:
      return "bg-amber-50 text-amber-700 border-amber-200"
  }
}

export function PlatformApplicationsConsole({ mode }: { mode: Mode }) {
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [status, setStatus] = useState("all")
  const [assignment, setAssignment] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({})
  const [followUpDates, setFollowUpDates] = useState<Record<string, string>>({})

  const token = getToken()

  const summary = useMemo(() => {
    return applications.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.status === "pending") acc.pending += 1
        if (item.status === "contacted") acc.contacted += 1
        if (item.status === "approved" || item.status === "account_created" || item.status === "active") acc.approved += 1
        return acc
      },
      { total: 0, pending: 0, contacted: 0, approved: 0 }
    )
  }, [applications])

  async function loadApplications() {
    if (!token) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set("status", status)
      params.set("limit", "100")
      if (mode === "staff") {
        params.set("assigned", assignment)
      }
      if (search.trim()) {
        params.set("search", search.trim())
      }

      const response = await fetch(`${API_URL}/api/platform/applications?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load applications")
      }

      setApplications(payload.data?.applications || [])
    } catch (error: any) {
      toast.error(error.message || "Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, assignment])

  async function handleApprove(id: string) {
    if (!token) return
    try {
      setActingId(id)
      const response = await platformApi.approveApplication(token, id)
      if (!response.success) throw new Error(response.error || "Failed to approve application")
      toast.success("Application approved and account creation email sent")
      await loadApplications()
    } catch (error: any) {
      toast.error(error.message || "Failed to approve application")
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(id: string) {
    if (!token) return
    try {
      setActingId(id)
      const response = await platformApi.rejectApplication(token, id, {
        reason: rejectionReason[id] || "Rejected by platform admin",
      })
      if (!response.success) throw new Error(response.error || "Failed to reject application")
      toast.success("Application rejected")
      await loadApplications()
    } catch (error: any) {
      toast.error(error.message || "Failed to reject application")
    } finally {
      setActingId(null)
    }
  }

  async function handleClaim(id: string) {
    if (!token) return
    try {
      setActingId(id)
      const response = await platformApi.claimApplication(token, id)
      if (!response.success) throw new Error(response.error || "Failed to claim application")
      toast.success("Application assigned to you")
      await loadApplications()
    } catch (error: any) {
      toast.error(error.message || "Failed to claim application")
    } finally {
      setActingId(null)
    }
  }

  async function handleContact(id: string) {
    if (!token) return
    try {
      setActingId(id)
      const response = await platformApi.contactApplication(token, id, {
        contact_notes: contactNotes[id] || "",
        follow_up_date: followUpDates[id] || undefined,
      })
      if (!response.success) throw new Error(response.error || "Failed to update application")
      toast.success("Application marked as contacted")
      await loadApplications()
    } catch (error: any) {
      toast.error(error.message || "Failed to update application")
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
            {mode === "admin" ? "Platform Admin Review" : "Platform Staff Follow Up"}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Organization applications</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {mode === "admin"
              ? "Review incoming institution applications, approve qualified organizations, and trigger account creation emails."
              : "Track incoming leads, claim ownership, record follow-up notes, and keep sales outreach aligned with the backend application workflow."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pending</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{summary.pending}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contacted / Approved</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{summary.contacted + summary.approved}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.45fr_0.45fr_0.3fr]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by organization, contact, email, or location"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {mode === "staff" ? (
            <select
              value={assignment}
              onChange={(e) => setAssignment(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            >
              {assignmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={loadApplications}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Refresh
            </button>
          )}

          {mode === "staff" && (
            <button
              type="button"
              onClick={loadApplications}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Refresh
            </button>
          )}
        </div>
      </section>

      <section className="space-y-5">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-base font-semibold text-slate-900">No matching applications found</p>
            <p className="mt-2 text-sm text-slate-500">Try changing the filters or search query.</p>
          </div>
        ) : (
          applications.map((application) => (
            <article key={application._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">{application.organization_name}</h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadge(application.status)}`}>
                      {application.status.replace("_", " ")}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {application.organization_type}
                    </span>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-slate-400" />
                      <span>{application.contact_person_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{application.contact_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{application.contact_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-slate-400" />
                      <span>{new Date(application.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Institution context</p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {application.city}, {application.state}, {application.country}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">Expected users: {application.expected_users || 0}</p>
                      {application.message ? (
                        <p className="mt-3 text-sm leading-6 text-slate-600">{application.message}</p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Assignment and notes</p>
                      <p className="mt-3 text-sm text-slate-700">
                        Assigned to: {application.assigned_to?.name || "Unassigned"}
                      </p>
                      {application.contact_notes ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">{application.contact_notes}</p>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-400">No follow-up notes yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full xl:max-w-md">
                  {mode === "admin" ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Platform admin actions</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Approve to send the organization account creation email. Reject to close the request with a reason.
                      </p>
                      <textarea
                        value={rejectionReason[application._id] || ""}
                        onChange={(e) => setRejectionReason((prev) => ({ ...prev, [application._id]: e.target.value }))}
                        placeholder="Optional rejection reason"
                        className="mt-4 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          disabled={actingId === application._id || application.status === "approved" || application.status === "account_created" || application.status === "active"}
                          onClick={() => handleApprove(application._id)}
                          className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={actingId === application._id || application.status === "rejected"}
                          onClick={() => handleReject(application._id)}
                          className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="inline-flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Reject
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Platform staff actions</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Claim the lead, log your outreach, and move it to contacted once sales follow-up begins.
                      </p>
                      <textarea
                        value={contactNotes[application._id] || ""}
                        onChange={(e) => setContactNotes((prev) => ({ ...prev, [application._id]: e.target.value }))}
                        placeholder="Call summary, outreach notes, or next step"
                        className="mt-4 min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                      <input
                        type="date"
                        value={followUpDates[application._id] || ""}
                        onChange={(e) => setFollowUpDates((prev) => ({ ...prev, [application._id]: e.target.value }))}
                        className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          disabled={actingId === application._id}
                          onClick={() => handleClaim(application._id)}
                          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Claim
                        </button>
                        <button
                          type="button"
                          disabled={actingId === application._id}
                          onClick={() => handleContact(application._id)}
                          className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark contacted
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
