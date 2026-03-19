"use client"

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Textarea } from "../../../components/ui/textarea"
import { authApi } from "../../../lib/api"

const trustPoints = [
  "College, school, institute, and training brand onboarding",
  "Flows directly into the backend organization application review process",
  "Built for academic setup, course approvals, and student delivery journeys",
]

const formHighlights = [
  "Institution profile",
  "Primary contact details",
  "Location and rollout size",
  "Goals for your platform",
]

export default function ApplyOrganizationPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [organizationName, setOrganizationName] = useState("")
  const [organizationType, setOrganizationType] = useState("school")
  const [contactPersonName, setContactPersonName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [country, setCountry] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [expectedUsers, setExpectedUsers] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          const userStr = localStorage.getItem("user")
          if (userStr) {
            const user = JSON.parse(userStr)
            if (["student", "instructor", "org_admin"].includes(user.role)) {
              toast.error("This page is for organization applicants only")
              router.push("/dashboard")
              return
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authApi.applyOrganization({
        organizationName,
        organizationType,
        contactPersonName,
        contactEmail,
        contactPhone,
        country,
        state,
        city,
        expectedUsers: parseInt(expectedUsers, 10) || 0,
        message,
      })

      if (response.success) {
        setSubmittedEmail(contactEmail)
        setSubmitted(true)
        toast.success("Application submitted successfully!")
      } else {
        toast.error(response.error || "Failed to submit application")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred during submission")
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f4efe7] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-full border border-[#d8d1c6] bg-white px-5 py-3 text-sm font-medium text-[#334155] shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-[#0f172a]" />
          Preparing your platform application
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f4efe7] px-6 py-10 lg:px-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full rounded-[36px] border border-[#ddd5c9] bg-white p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.08)] md:p-12"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.28em] text-[#b45309]">Application received</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#0f172a] md:text-5xl">
              Your platform request is in review.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#475569]">
              We received the application for <span className="font-semibold text-[#0f172a]">{organizationName}</span>.
              Updates will be sent to <span className="font-semibold text-[#0f172a]">{submittedEmail}</span> once the
              backend review process moves forward.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                onClick={() => router.push("/")}
                className="h-12 rounded-full bg-[#0f172a] px-8 text-sm font-semibold text-white hover:bg-[#1e293b]"
              >
                Return to home
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/login")}
                className="h-12 rounded-full border-[#c9c1b4] px-8 text-sm font-semibold text-[#0f172a]"
              >
                Sign in
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4efe7] text-[#0f172a]">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_28%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-bold text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
              SL
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#64748b]">Smart LMS</p>
              <p className="text-sm font-semibold text-[#0f172a]">Platform Application</p>
            </div>
          </Link>

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="h-11 rounded-full px-5 text-sm font-semibold text-[#334155] hover:bg-white/70 hover:text-[#0f172a]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[36px] border border-[#ddd5c9] bg-[#0f172a] p-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.18)] lg:p-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#fbbf24]">
              <Sparkles className="h-3.5 w-3.5" />
              Create your own platform
            </div>

            <h1 className="mt-8 text-4xl font-bold leading-[0.98] tracking-[-0.05em] md:text-5xl">
              Tell us about your institution and we will open the right path.
            </h1>
            <p className="mt-6 text-lg leading-8 text-[#cbd5e1]">
              This application feeds the real organization onboarding flow. Once approved, your institution can move
              into setup, governance, course publishing, live classes, and student delivery with the same backend
              system we already validated.
            </p>

            <div className="mt-10 grid gap-4">
              {trustPoints.map((point) => (
                <div key={point} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <p className="text-sm leading-6 text-[#e2e8f0]">{point}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#94a3b8]">What you will submit</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {formHighlights.map((item) => (
                  <div key={item} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e2e8f0]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[36px] border border-[#ddd5c9] bg-white p-8 shadow-[0_30px_100px_rgba(15,23,42,0.08)] lg:p-10"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b45309]">Organization application</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#0f172a] md:text-4xl">
              Launch the review process for your platform.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748b]">
              Fill this once. It submits to the backend application endpoint and lets the team review your institution
              before activation.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-7">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-sm font-semibold text-[#0f172a]">
                    Organization name
                  </Label>
                  <Input
                    id="organizationName"
                    placeholder="Global Academy"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationType" className="text-sm font-semibold text-[#0f172a]">
                    Organization type
                  </Label>
                  <Select value={organizationType} onValueChange={setOrganizationType} required>
                    <SelectTrigger id="organizationType" className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="college">College</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="institute">Institute</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPersonName" className="text-sm font-semibold text-[#0f172a]">
                    Contact person name
                  </Label>
                  <Input
                    id="contactPersonName"
                    placeholder="John Doe"
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-semibold text-[#0f172a]">
                    Contact phone
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-sm font-semibold text-[#0f172a]">
                  Contact email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@globalacademy.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                />
                <p className="text-xs leading-5 text-[#64748b]">Approval updates and next steps will be sent here.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold text-[#0f172a]">
                    Country
                  </Label>
                  <Input
                    id="country"
                    placeholder="United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-semibold text-[#0f172a]">
                    State
                  </Label>
                  <Input
                    id="state"
                    placeholder="California"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-[#0f172a]">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-2">
                  <Label htmlFor="expectedUsers" className="text-sm font-semibold text-[#0f172a]">
                    Expected users
                  </Label>
                  <Input
                    id="expectedUsers"
                    type="number"
                    min="0"
                    placeholder="500"
                    value={expectedUsers}
                    onChange={(e) => setExpectedUsers(e.target.value)}
                    className="h-13 rounded-2xl border-[#d8d1c6] bg-[#fcfaf6] px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-semibold text-[#0f172a]">
                    What do you want to launch?
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your academic model, courses, rollout plans, or any specific needs."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="rounded-3xl border-[#d8d1c6] bg-[#fcfaf6] px-4 py-3"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-[#ece5d9] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-6 text-[#64748b]">
                  By submitting, you are starting the organization application workflow that the backend already supports.
                </p>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-13 rounded-full bg-[#0f172a] px-8 text-sm font-semibold text-white hover:bg-[#1e293b]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting application
                    </>
                  ) : (
                    "Submit platform application"
                  )}
                </Button>
              </div>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
