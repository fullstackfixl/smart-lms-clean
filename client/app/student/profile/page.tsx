"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Calendar, MapPin, AlertCircle, Edit } from "lucide-react"
import { Skeleton } from '../../../components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { toast } from "sonner"
import { getProfile, updateProfile, updateAvatar } from '../../../lib/services/studentApi'
import { getInitials } from '../../../lib/utils'

interface UserProfile {
  _id: string
  name: string
  email: string
  phone?: string
  location?: string
  bio?: string
  avatar?: string
  created_at: string
  enrollments_count?: number
  completed_courses?: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError(null)
    try {
      const response = await getProfile()

      if (response.success && response.data) {
        setProfile(response.data)
        setFormData({
          name: response.data.name || '',
          phone: response.data.phone || '',
          location: response.data.location || '',
          bio: response.data.bio || ''
        })
      } else {
        setError(response.message || "Failed to load profile")
      }
    } catch (err: any) {
      console.error('Profile error:', err)
      setError(err.response?.data?.message || "Network error occurred")
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const response = await updateProfile(formData)

      if (response.success) {
        toast.success("Profile updated successfully!")
        setEditing(false)
        await loadProfile()
      } else {
        toast.error(response.message || "Failed to update profile")
      }
    } catch (err: any) {
      console.error('Update error:', err)
      toast.error(err.response?.data?.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await updateAvatar(formData)

      if (response.success) {
        toast.success("Avatar updated successfully!")
        await loadProfile()
      } else {
        toast.error(response.message || "Failed to update avatar")
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      toast.error(err.response?.data?.message || "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-12">
        <div>
          <Skeleton className="h-16 w-96 bg-slate-800/50 mb-4" />
          <Skeleton className="h-6 w-64 bg-slate-800/50" />
        </div>
        <Skeleton className="h-96 bg-slate-800/50" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold text-white mb-3">Profile</h1>
          <p className="text-xl text-slate-300">Manage your personal information</p>
        </motion.div>

        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Profile</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={loadProfile}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  if (!profile) return null

  const joinedDate = profile.created_at || (profile as any).createdAt
  const formattedDate = joinedDate
    ? new Date(joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A'

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Profile Settings</h1>
        <p className="text-slate-500 mt-2">Manage your personal information and account security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Avatar & Stats */}
        <div className="md:col-span-4 space-y-6">
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white">
            <CardContent className="p-8 flex flex-col items-center">
              <div className="relative group mb-6">
                <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-inner">
                  {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name} />}
                  <AvatarFallback className="bg-gradient-to-br from-[#4CAF50] to-[#45a049] text-white text-3xl font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Edit className="h-6 w-6 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-800 text-center mb-1">{profile.name}</h2>
              <p className="text-sm text-slate-500 text-center mb-6">{profile.email}</p>

              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={uploadingAvatar}
                className="w-full border-slate-200 text-slate-600 font-bold h-10 rounded-lg hover:bg-slate-50"
              >
                {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
              <p className="text-2xl font-black text-[#4CAF50]">{profile.enrollments_count || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courses</p>
            </div>
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
              <p className="text-2xl font-black text-[#FFC107]">{profile.completed_courses || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
            </div>
          </div>
        </div>

        {/* Right: Detailed Info */}
        <div className="md:col-span-8">
          <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
            <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Personal Information</h3>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  variant="ghost"
                  className="text-[#4CAF50] hover:bg-green-50 font-bold gap-2"
                >
                  <Edit className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>

            <CardContent className="p-8">
              {editing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase">Full Name</Label>
                      <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="border-slate-200 focus:ring-[#4CAF50]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase">Phone Number</Label>
                      <Input
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="border-slate-200 focus:ring-[#4CAF50]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">Location</Label>
                    <Input
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="border-slate-200 focus:ring-[#4CAF50]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400 uppercase">Short Bio</Label>
                    <textarea
                      rows={4}
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#4CAF50]"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold px-8 rounded-lg shadow-sm"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={() => setEditing(false)}
                      variant="ghost"
                      className="text-slate-500 font-bold"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                    <InfoItem icon={User} label="Full Name" value={profile.name} color="blue" />
                    <InfoItem icon={Mail} label="Email Address" value={profile.email} color="green" />
                    <InfoItem icon={MapPin} label="Location" value={profile.location || "Not specified"} color="teal" />
                    <InfoItem icon={Calendar} label="Member Since" value={formattedDate} color="orange" />
                  </div>

                  <div className="pt-8 border-t border-slate-50">
                    <Label className="text-xs font-bold text-slate-400 uppercase block mb-3">Professional Bio</Label>
                    <p className="text-slate-600 leading-relaxed italic">
                      {profile.bio || "No bio information provided yet."}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    teal: "bg-teal-50 text-teal-600",
    orange: "bg-orange-50 text-orange-600",
  }

  return (
    <div className="flex items-start gap-4">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", colors[color])}>
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  )
}
import { Card, CardContent } from '../../../components/ui/card'
import { cn } from '../../../lib/utils'
