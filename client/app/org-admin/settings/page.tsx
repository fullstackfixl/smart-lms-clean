"use client"
 
import { MinimalInput } from "../../../components/org-admin/core/MinimalForm"
import { useAuth } from "../../../lib/auth-context"
import { Button } from "../../../components/ui/button"
import { useEffect, useMemo, useState } from "react"
import { API_URL } from "../../../lib/config"
import { toast } from "sonner"
 
export default function SettingsPage() {
  const { organization, token, refreshMe } = useAuth()

  const initialLogo = organization?.branding?.logo || organization?.logo_url || null
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setLogoUrl(initialLogo)
  }, [initialLogo])

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  async function uploadLogo(file: File) {
    if (!token) {
      toast.error('Not authenticated')
      return
    }
    setUploading(true)
    const t = toast.loading('Uploading logo...')
    try {
      const form = new FormData()
      form.append('logo', file)

      const res = await fetch(`${API_URL}/api/admin/settings/logo`, {
        method: 'POST',
        headers: authHeader,
        body: form,
        credentials: 'include'
      })

      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setLogoUrl(json.data?.logo || json.logo || null)
        toast.success('Logo uploaded', { id: t })
        await refreshMe()
        return
      }

      // Fallback: store base64 in branding settings
      const dataUrl = await fileToDataUrl(file)
      const saveRes = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ logo: dataUrl }),
        credentials: 'include'
      })
      const saveJson = await saveRes.json().catch(() => null)
      if (!saveRes.ok || !saveJson?.success) {
        throw new Error(saveJson?.message || json?.message || 'Failed to upload logo')
      }
      setLogoUrl(dataUrl)
      toast.success('Logo saved', { id: t })
      await refreshMe()
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed', { id: t })
    } finally {
      setUploading(false)
    }
  }

  async function saveBranding() {
    if (!token) {
      toast.error('Not authenticated')
      return
    }
    setSaving(true)
    const t = toast.loading('Saving settings...')
    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ logo: logoUrl }),
        credentials: 'include'
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Failed to save settings')
      }
      toast.success('Settings saved', { id: t })
      await refreshMe()
    } catch (e: any) {
      toast.error(e?.message || 'Save failed', { id: t })
    } finally {
      setSaving(false)
    }
  }
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-[14px] text-slate-500 font-medium">Configure institutional protocols and platform preferences.</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={saving} onClick={saveBranding}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
 
      {/* ─── Configuration Stack ────────────────────────────────────── */}
      <div className="max-w-2xl space-y-10">

         <div className="space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest italic">{'// Branding'}</h3>
            <div className="p-5 bg-white border border-gray-200 rounded-md space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-slate-900 uppercase">Organization Logo</p>
                  <p className="text-[11px] text-slate-500">This logo will appear across org-admin and student dashboards.</p>
                </div>
                <label className="inline-flex items-center justify-center px-4 h-10 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-black uppercase tracking-widest cursor-pointer transition-colors disabled:opacity-60">
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadLogo(file)
                      e.currentTarget.value = ''
                    }}
                  />
                </label>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl border border-gray-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Logo</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Current Logo URL</p>
                  <p className="text-[12px] text-slate-500 truncate">{logoUrl || '—'}</p>
                </div>
              </div>
            </div>
         </div>
         
         <div className="space-y-6">
            <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest italic">{'// General Protocols'}</h3>
            <div className="space-y-4">
               <MinimalInput label="Organization Name" defaultValue={organization?.name} />
               <MinimalInput label="Contact Email" placeholder="admin@org.com" />
               <MinimalInput label="Timezone" defaultValue="UTC (Coordinated Universal Time)" />
            </div>
         </div>
 
         <div className="space-y-6 pt-4">
            <h3 className="text-[16px] font-bold text-slate-900 uppercase tracking-widest italic">{'// Security & Privacy'}</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-md">
                  <div className="space-y-0.5">
                     <p className="text-[13px] font-bold text-slate-900 uppercase">Two-Factor Authentication</p>
                     <p className="text-[11px] text-slate-500">Enforce secondary verification for all administrators.</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#F97316] uppercase italic">Disabled</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-gray-100 rounded-md">
                  <div className="space-y-0.5">
                     <p className="text-[13px] font-bold text-slate-900 uppercase">Public Directory</p>
                     <p className="text-[11px] text-slate-500">List this organization in the marketplace discovery hub.</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#10B981] uppercase italic">Active</span>
               </div>
            </div>
         </div>
 
      </div>
 
    </div>
  )
}
