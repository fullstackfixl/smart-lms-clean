"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { platformApi } from '../../../lib/api'

export default function PlatformStaffAcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [success, setSuccess] = useState(false)

  const tokenValue = useMemo(() => token, [token])

  useEffect(() => {
    let cancelled = false
    async function verify() {
      if (!tokenValue) {
        setVerifying(false)
        return
      }

      try {
        const res = await platformApi.verifyStaffInvite(tokenValue)
        if (cancelled) return
        if (res.success) {
          const data = res.data as any
          setInvite(data)
          setName(data?.name || '')
        } else {
          setInvite(null)
          toast.error(res.error || 'Invalid invitation link')
        }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Failed to verify invitation')
      } finally {
        if (!cancelled) setVerifying(false)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [tokenValue])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenValue) {
      toast.error('Invitation token missing')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await platformApi.acceptStaffInvite({ token: tokenValue, name, password })
      if (!res.success) throw new Error(res.error || 'Failed to activate account')
      setSuccess(true)
      toast.success('Account activated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate account')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">Account activated</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your platform staff account is ready. Use your email and password to sign in.
        </p>
        <Button
          onClick={() => router.push('/platform-staff/login')}
          className="mt-6 h-11 w-full rounded-md bg-orange-500 font-bold text-white shadow-none hover:bg-orange-600"
        >
          Go to login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-orange-500">Platform Staff Invite</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Activate your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Set your password to join the platform staff workspace.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      {verifying ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying invitation link...
        </div>
      ) : !tokenValue || !invite ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          This invitation link is missing, invalid, or expired.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Invited email</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{invite.email}</div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 border-slate-200 focus:border-orange-500" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-slate-200 pr-10 focus:border-orange-500"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Confirm password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 border-slate-200 focus:border-orange-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-md bg-orange-500 font-bold text-white shadow-none hover:bg-orange-600"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Activate account
          </Button>
        </form>
      )}
    </div>
  )
}
