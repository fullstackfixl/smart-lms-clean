"use client"

import { useState, useEffect } from "react"
import { User, Mail, Camera, Check, RefreshCw } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { useAuth } from '../../../lib/auth-context'
import { authApi } from '../../../lib/api'
import { toast } from "sonner"

export default function InstructorProfilePage() {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
    twitter: "",
  })

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        bio: (user as any).bio || "",
        website: (user as any).website || "",
        twitter: (user as any).twitter || "",
      })
    }
  }, [user])

  async function handleSave() {
    if (!token) return
    setSaving(true)
    try {
      const res = await authApi.updateMe(token, {
        name: profile.name,
        bio: profile.bio,
        website: profile.website,
        twitter: profile.twitter,
      })
      if (res.success) {
        toast.success("Profile updated successfully")
      } else {
        toast.error(res.error || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Error updating profile")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-slate-500 mt-1">Manage your public profile and personal information.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
              {profile.name.charAt(0) || user.name?.charAt(0) || "?"}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Profile Photo</h3>
            <p className="text-sm text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={profile.email}
                disabled
                className="bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Website</Label>
              <Input
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label>Twitter</Label>
              <Input
                value={profile.twitter}
                onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Saving..." : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
          </Button>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-slate-500">Role</span>
            <span className="font-medium text-slate-900 capitalize">{user.role || "Instructor"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-slate-500">Organization</span>
            <span className="font-medium text-slate-900">{(user as any).organizationName || "-"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-slate-500">Member Since</span>
            <span className="font-medium text-slate-900">
              {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString() : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
