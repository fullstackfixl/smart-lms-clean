"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Check, Loader2, User, Mail, Phone, RefreshCw } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { authApi } from "../../lib/api"
import { toast } from "sonner"
import { UserAvatar } from "../ui/UserAvatar"

interface UniversalProfilePageProps {
  role: "org_admin" | "instructor" | "student"
}

export function UniversalProfilePage({ role }: UniversalProfilePageProps) {
  const { user, token, refreshMe } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    bio: "",
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: (user as any).profile?.phone || "",
        bio: (user as any).profile?.bio || "",
      })
      setPreviewSrc((user as any).profilePicture || null)
    }
  }, [user])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please use PNG, JPEG, WebP, or GIF.")
      return
    }

    // 5MB max
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum allowed is 5MB.")
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewSrc(reader.result as string)
      setUploading(false)
    }
    reader.onerror = () => {
      toast.error("Failed to read image file.")
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      const res = await authApi.updateMe(token, {
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        profilePicture: previewSrc,
      })
      if (res.success) {
        toast.success("Profile updated successfully!")
        await refreshMe()
      } else {
        toast.error(res.error || "Failed to save profile")
      }
    } catch (err) {
      toast.error("Network error while saving profile")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const roleLabel: Record<string, string> = {
    org_admin: "Organization Admin",
    instructor: "Instructor",
    student: "Student",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">My Profile</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your profile photo and personal information.</p>
      </div>

      {/* Profile Picture Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-bold text-slate-800 text-lg mb-5">Profile Photo</h2>
        <div className="flex items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative group">
            {uploading ? (
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <UserAvatar name={form.name || user.name} src={previewSrc} size="xl" />
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-all group-hover:scale-110"
              title="Change photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-slate-800">{form.name || user.name}</p>
            <p className="text-sm text-slate-500">{roleLabel[role] || role}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Click to upload a new photo
            </button>
            <p className="text-xs text-slate-400">PNG, JPEG, WebP, GIF. Max 5MB.</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <h2 className="font-bold text-slate-800 text-lg">Personal Information</h2>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <User className="w-4 h-4" /> Full Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            placeholder="Your full name"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-100 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400">Email cannot be changed here.</p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
            <Phone className="w-4 h-4" /> Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            placeholder="+91 9876543210"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-600">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
            placeholder="Tell us something about yourself..."
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Check className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="font-bold text-slate-800 text-lg mb-4">Account Information</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: "Role", value: roleLabel[role] || role },
            { label: "User ID", value: user._id },
            { label: "Account Status", value: (user as any).status || "Active" },
            { label: "Email Verified", value: (user as any).email_verified ? "Yes ✓" : "No" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-slate-500 font-medium">{label}</span>
              <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UniversalProfilePage
