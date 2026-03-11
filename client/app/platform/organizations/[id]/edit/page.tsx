"use client"
 
import { useState, useEffect, Suspense } from "react"
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Check, 
  X,
  Settings2,
  Database,
  ChevronDown,
  Sparkles
} from "lucide-react"
import { platformApi } from '../../../../../lib/api'
import { useRouter, useParams } from "next/navigation"
import { useAuth } from '../../../../../lib/auth-context'
import { cn } from "../../../../../lib/utils"
import { Card } from "../../../../../components/ui/card"
import { Button } from "../../../../../components/ui/button"
import { Input } from "../../../../../components/ui/input"
import { Label } from "../../../../../components/ui/label"
import { PlatformErrorState } from "../../../../../components/platform/platform-error-state"
 
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
 
function EditContent() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuth()
  const id = params.id as string
 
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "basic" as 'basic' | 'premium',
    address: { street: "", city: "", state: "", country: "", zipCode: "" }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
 
  useEffect(() => { loadOrganization() }, [id, token])
 
  const loadOrganization = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await platformApi.getOrg(token, id)
      if (response.success && response.data) {
        const org = response.data as any
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
    } catch { setError("Identity synchronization failure") } finally { setLoading(false) }
  }
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError("")
    try {
      const response = await platformApi.updateOrg(token, id, formData)
      if (response.success) router.push(`/platform/organizations/${id}`)
      else setError(response.error || "Configuration update failure")
    } catch { setError("Critical system failure during reconfiguration") } finally { setSaving(false) }
  }
 
  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <div className="text-sm text-slate-500 font-medium">Loading...</div>
     </div>
  )
 
  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-20">
      
      {/* ─── Reconfig Hero ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <button onClick={() => router.push(`/platform/organizations/${id}`)} className="text-slate-500 hover:text-blue-600 font-bold text-sm flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </button>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">Edit Organization</h1>
          <p className="mt-2 text-slate-500">Update institutional parameters for {formData.name || 'this organization'}.</p>
        </div>
        <div className="text-xs text-slate-400 font-mono uppercase">ID: {id.slice(-8).toUpperCase()}</div>
      </div>
 
      {/* ─── Reconfig Form ────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-12">
        {error && (
          <PlatformErrorState title="Update failed" message={error} />
        )}
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           
           {/* Section: Core Parameters */}
           <Card className="bg-white border border-slate-200 p-8 rounded-md space-y-8">
              <div className="space-y-2">
                 <h3 className="text-sm font-bold text-slate-900">Core Parameters</h3>
                 <p className="text-xs text-slate-500">Institutional identity and plan configuration.</p>
              </div>
 
              <div className="space-y-8">
                 <div className="space-y-1.5">
                   <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organization Name</Label>
                   <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 border-gray-200" required />
                 </div>
                 <div className="space-y-1.5">
                   <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin Email</Label>
                   <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-11 border-gray-200" required />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phone</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 border-gray-200" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plan</Label>
                       <div className="relative group">
                          <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value as 'basic' | 'premium' })}
                            className="w-full h-11 rounded-md bg-white border border-gray-200 px-3 text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-blue-500"
                          >
                             <option value="basic">Basic</option>
                             <option value="premium">Premium</option>
                          </select>
                          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none group-focus-within:text-indigo-500" />
                       </div>
                    </div>
                 </div>
              </div>
           </Card>
 
           {/* Section: Spatial Parameters */}
           <Card className="bg-white border border-slate-200 p-8 rounded-md space-y-8">
              <div className="space-y-2">
                 <h3 className="text-sm font-bold text-slate-900">Address</h3>
                 <p className="text-xs text-slate-500">Optional contact and location fields.</p>
              </div>
 
              <div className="space-y-8">
                 <div className="space-y-1.5">
                   <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Street</Label>
                   <Input value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} className="h-11 border-gray-200" />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">City</Label>
                      <Input value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} className="h-11 border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">State</Label>
                      <Input value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} className="h-11 border-gray-200" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">ZIP</Label>
                      <Input value={formData.address.zipCode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })} className="h-11 border-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Country</Label>
                      <Input value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className="h-11 border-gray-200" />
                    </div>
                 </div>
              </div>
           </Card>
 
        </div>
 
        <div className="flex gap-6 items-center justify-end px-4">
          <Button type="button" variant="outline" className="h-11 border-gray-200 bg-white font-bold" onClick={() => router.push(`/platform/organizations/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={saving}>
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
 
function LogicInput({ label, placeholder, icon, value, onValueChange }: any) {
  return (
    <div className="space-y-3 flex-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative group">
        {icon && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors pointer-events-none">{icon}</div>}
        <input
          required
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 px-6 text-[14px] font-black focus:ring-[10px] focus:ring-indigo-500/5 focus:bg-white transition-all outline-none",
            icon && "pl-14"
          )}
        />
      </div>
    </div>
  )
}
 
export default function EditOrganizationPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-16 w-16 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       </div>
    }>
       <EditContent />
    </Suspense>
  )
}
