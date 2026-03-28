"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { 
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Layers3,
  Lock,
  Save,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { platformJsonFetcher } from "../../../../lib/platform-fetcher"
import { PlatformErrorState } from "../../../../components/platform/platform-error-state"
import { API_URL, getToken } from "../../../../lib/config"
import { Button } from "../../../../components/ui/button"
import { Badge } from "../../../../components/ui/badge"
import { Card } from "../../../../components/ui/card"
import { cn } from "../../../../lib/utils"

type AccessModelResponse = {
  catalog: Array<{
    key: string
    title: string
    description: string
    permissions: string[]
  }>
  featureToggles: Record<string, boolean>
  organizationTypes: Array<{ value: string; label: string }>
  organizationServices: Array<{ key: string; label: string }>
  sidebarSections: Array<{ label: string; href: string }>
  roleMatrix: Record<string, string[]>
  systemConfig: {
    platformName: string
    supportEmail: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    emailVerificationRequired: boolean
    maxOrganizations: number | null
    defaultPlan: string
  }
}

const FEATURE_ORDER = [
  { key: 'liveClasses', label: 'Live Classes' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'discussionForums', label: 'Discussion Forums' },
  { key: 'aiTutor', label: 'AI Tutor' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'gamification', label: 'Gamification' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'webinars', label: 'Webinars' },
  { key: 'advanced_analytics', label: 'Advanced Analytics' },
  { key: 'ai_tools', label: 'AI Tools' }
]

export default function RolesPage() {
  const { data: response, error, isLoading, mutate } = useSWR<{ success: boolean; data: AccessModelResponse }>(
    '/api/platform/access-model',
    platformJsonFetcher
  )

  const accessModel = response?.data
  const [selectedGroup, setSelectedGroup] = useState<string>('global_visibility')
  const [draftToggles, setDraftToggles] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (accessModel?.catalog?.length && !accessModel.catalog.find(group => group.key === selectedGroup)) {
      setSelectedGroup(accessModel.catalog[0].key)
    }
  }, [accessModel, selectedGroup])

  useEffect(() => {
    if (accessModel?.featureToggles) {
      setDraftToggles(accessModel.featureToggles)
    }
  }, [accessModel])

  const selectedPermissions = accessModel?.catalog?.find(group => group.key === selectedGroup)

  const enabledCount = useMemo(() => {
    return Object.values(draftToggles).filter(Boolean).length
  }, [draftToggles])

  const handleToggle = (key: string) => {
    setDraftToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/api/platform/access-model/feature-toggles`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ features: draftToggles })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Global feature toggles synchronized')
        mutate()
      } else {
        toast.error(data.message || 'Failed to update feature toggles')
      }
    } catch {
      toast.error('Network synchronization failure')
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return <PlatformErrorState />
  }

  if (isLoading || !accessModel) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-80 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  const catalog = accessModel.catalog || []
  const matrix = accessModel.roleMatrix || {}
  const platformPermissions = catalog.reduce((sum, group) => sum + group.permissions.length, 0)

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              <Shield className="h-3.5 w-3.5" />
              Enterprise Access Control
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Super Admin Permissions
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                One modular monolith, one database, one API. This control center defines the platform-wide
                governance model: global visibility, tenant controls, role management, and the feature switches
                that every organization inherits.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {catalog.length} permission groups
              </Badge>
              <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {platformPermissions} scoped permissions
              </Badge>
              <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {enabledCount} global features enabled
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
            <Card className="rounded-2xl border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Platform</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{accessModel.systemConfig.platformName}</p>
                </div>
                <Layers3 className="h-5 w-5 text-blue-600" />
              </div>
            </Card>
            <Card className="rounded-2xl border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Default Plan</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{accessModel.systemConfig.defaultPlan}</p>
                </div>
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Permission Groups</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Select a capability block to inspect the exact platform permissions.
              </p>
            </div>
            <SlidersHorizontal className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-5 space-y-2">
            {catalog.map((group) => {
              const active = selectedGroup === group.key
              const roleCount = Object.entries(matrix).filter(([, permissions]) => permissions?.some(permission => group.permissions.includes(permission))).length

              return (
                <button
                  key={group.key}
                  onClick={() => setSelectedGroup(group.key)}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition-all',
                    active ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold', active ? 'text-blue-700' : 'text-slate-900')}>
                          {group.title}
                        </span>
                        {active && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
                    </div>
                    <Badge className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {group.permissions.length}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{roleCount} role buckets</span>
                    <span>Read/Write Matrix</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Eye className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">View platform as organization</p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  This is the debugging mode you asked for: platform admin can inspect College A, then drill
                  into instructor, course, and batch context without logging in as that user.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">{selectedPermissions?.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedPermissions?.description}</p>
              </div>
              <Badge className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {selectedPermissions?.permissions.length || 0} permissions
              </Badge>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {selectedPermissions?.permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-slate-700">{permission}</span>
                  <Badge className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Enabled
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Global Feature Toggles</h2>
                <p className="mt-1 text-sm text-slate-500">
                  These switches determine what organizations can see in their own admin shells.
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-11 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
              >
                {saving ? <Save className="mr-2 h-4 w-4 animate-pulse" /> : <Save className="mr-2 h-4 w-4" />}
                Sync Toggles
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {FEATURE_ORDER.map((feature) => {
                const on = Boolean(draftToggles[feature.key])
                return (
                  <button
                    key={feature.key}
                    onClick={() => handleToggle(feature.key)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all',
                      on ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div>
                      <p className={cn('text-sm font-bold', on ? 'text-emerald-900' : 'text-slate-900')}>
                        {feature.label}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {on ? 'Available to organizations' : 'Globally disabled'}
                      </p>
                    </div>
                    <div className={cn('flex h-6 w-11 items-center rounded-full p-1 transition-all', on ? 'bg-emerald-500' : 'bg-slate-300')}>
                      <div className={cn('h-4 w-4 rounded-full bg-white transition-all', on ? 'translate-x-5' : 'translate-x-0')} />
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-black text-slate-950">Organization Types</h3>
                  <p className="text-xs text-slate-500">Reusable tenant archetypes for onboarding and templates.</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {accessModel.organizationTypes.map((type) => (
                  <Badge
                    key={type.value}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600"
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-black text-slate-950">Inherited Services</h3>
                  <p className="text-xs text-slate-500">Organization-level services driven by global platform flags.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {accessModel.organizationServices.map((service) => (
                  <div
                    key={service.key}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-slate-700">{service.label}</span>
                    <Badge className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      Inherited
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-slate-950">Monolithic governance rule</h3>
                <p className="text-xs text-slate-500">
                  Keep this inside the modular monolith. One API, one database, module boundaries by domain, not by service.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Single database and transaction boundary
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Auditable permission changes and global feed
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Organization templates reusable across tenants
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                Feature toggles hidden when globally disabled
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
