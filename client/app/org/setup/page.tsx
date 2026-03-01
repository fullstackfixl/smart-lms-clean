"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Building2, Lock, ShieldCheck, MapPin, Phone, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import { platformApi } from '../../../lib/api'

function SetupForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [orgData, setOrgData] = useState<{ name: string; type: string } | null>(null)

    const [formData, setFormData] = useState({
        address: "",
        phone: "",
        password: "",
        confirmPassword: ""
    })

    useEffect(() => {
        if (!token) {
            setError("Invitation token is missing.")
            setVerifying(false)
            setLoading(false)
            return
        }

        const verifyToken = async () => {
            try {
                const response = await platformApi.verifyOrgInvite(token)
                if (response.success && response.data) {
                    setOrgData((response.data as any).organization)
                } else {
                    setError(response.error || "Invalid or expired invitation link.")
                }
            } catch (err) {
                setError("Failed to verify invitation link.")
            } finally {
                setVerifying(false)
                setLoading(false)
            }
        }

        verifyToken()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setLoading(true)
        setError("")

        try {
            const response = await platformApi.completeOrgSetup({
                token: token!,
                address: formData.address,
                phone: formData.phone,
                password: formData.password
            })

            if (response.success) {
                setSuccess(true)
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            } else {
                setError(response.error || "Failed to complete setup.")
            }
        } catch (err) {
            setError("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    if (verifying) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Verifying invitation...</p>
            </div>
        )
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
            >
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-gray-50 mb-4">Setup Completed!</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                    Your organization account is now active. You will be redirected to the login page in a few seconds.
                </p>
                <button
                    onClick={() => router.push("/login")}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                    Go to Login
                </button>
            </motion.div>
        )
    }

    if (error && !orgData) {
        return (
            <div className="text-center py-10">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 mb-6">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-50 mb-4">Invalid Invitation</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-8">{error}</p>
                <button
                    onClick={() => router.push("/")}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                    Return to Home
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-10 text-center">
                <Building2 className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-50 mb-2">Complete Your Setup</h2>
                <p className="text-gray-400">
                    Welcome to Smart LMS. Setup your organization profile for <span className="text-indigo-400 font-semibold">{orgData?.name}</span>.
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3"
                >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>{error}</p>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 md:p-8 shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-200 mb-6 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-indigo-400" />
                        Organization Details
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Organization Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <textarea
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full min-h-[100px] rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    placeholder="Street, City, State, Country, ZIP"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Contact Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800/50 my-8" />

                    <h3 className="text-lg font-semibold text-gray-200 mb-6 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-indigo-400" />
                        Admin Security
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Set Admin Password</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    placeholder="Min. 8 characters"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full h-12 rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                    placeholder="Repeat your password"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Completing Setup...
                        </>
                    ) : (
                        "Complete Organization Setup"
                    )}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
                By completing this setup, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    )
}

export default function SetupPage() {
    return (
        <div className="min-h-screen bg-[#020617] text-gray-100 py-12 px-4 selection:bg-indigo-500/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            }>
                <SetupForm />
            </Suspense>
        </div>
    )
}
