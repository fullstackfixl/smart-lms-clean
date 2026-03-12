"use client"

export const dynamic = 'force-dynamic'

import React, { useMemo, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { API_URL } from "../../../lib/config"

export default function AcceptInvitePage() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [invite, setInvite] = useState<any>(null)
    const { acceptInvite } = useAuth()
    const router = useRouter()

    const tokenValue = useMemo(() => token || '', [token])

    useEffect(() => {
        let cancelled = false
        async function verify() {
            try {
                if (!tokenValue) {
                    setInvite(null)
                    return
                }
                const res = await fetch(`${API_URL}/api/auth/accept-invite/verify?token=${encodeURIComponent(tokenValue)}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                })
                const data = await res.json()
                if (cancelled) return
                if (data?.success) {
                    setInvite(data.data)
                } else {
                    setInvite(null)
                    if (typeof window !== 'undefined') {
                        toast.error(data?.message || 'Invalid or expired invitation link')
                    }
                }
            } catch {
                if (!cancelled && typeof window !== 'undefined') {
                    toast.error('Failed to verify invitation link')
                }
                if (!cancelled) setInvite(null)
            } finally {
                if (!cancelled) setVerifying(false)
            }
        }
        verify()
        return () => {
            cancelled = true
        }
    }, [tokenValue])

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tokenValue) {
            toast.error('Invitation token missing')
            return
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setLoading(true)
        const result = await acceptInvite({
            token: tokenValue,
            name,
            password
        })
        setLoading(false)

        if (result.success) {
            setSuccess(true)
            toast.success("Account activated successfully!")
        } else {
            toast.error(result.error || "Failed to activate account")
        }
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <div className="mb-6 flex justify-center text-primary">
                    <CheckCircle2 className="h-16 w-16" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Account Activated!</h1>
                <p className="mt-2 text-muted-foreground">
                    Your account is now active. You can sign in using your email and the password you just set.
                </p>
                <Button className="mt-8 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 rounded-md shadow-none" onClick={() => router.push("/login")}>
                    Sign in now
                </Button>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-none">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Invitation Setup</div>
                        <h1 className="mt-2 text-2xl font-bold text-slate-900">Activate your account</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Set your name and password to join your organization workspace.
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                </div>

                {verifying ? (
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying invitation link...
                    </div>
                ) : !tokenValue || !invite ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        This invitation link is missing, invalid, or expired. Please request a new invitation.
                    </div>
                ) : (
                    <>
                        <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organization</div>
                            <div className="text-sm font-bold text-slate-900">{invite?.organization?.name}</div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{invite?.role}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest rounded-full bg-orange-50 text-orange-700 px-2 py-0.5">{invite?.organization?.type}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Invited Email</div>
                            <div className="text-sm font-medium text-slate-700 break-all">{invite?.email}</div>
                        </div>

                        <form onSubmit={handleAccept} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-11 border-gray-300 bg-white focus:border-orange-500"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500">Set Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Minimum 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 border-gray-300 bg-white pr-10 focus:border-orange-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-slate-500">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-11 border-gray-300 bg-white focus:border-orange-500"
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 rounded-md shadow-none"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Activate Account
                                </Button>
                                <div className="mt-3 text-xs text-slate-500">
                                    By continuing, you’ll activate your account for <span className="font-bold text-slate-700">{invite?.organization?.name}</span>.
                                </div>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </motion.div>
    )
}
