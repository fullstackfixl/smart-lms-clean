"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Mail, Calendar, MapPin, AlertCircle, Edit } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getProfile, updateProfile, updateAvatar } from "@/lib/services/studentApi"
import { getInitials } from "@/lib/utils"

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

      <div className="rounded-2xl bg-black/50 backdrop-blur-md border border-slate-700/50 p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <Avatar className="h-32 w-32 border-4 border-orange-500 mb-4">
              {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.name} />}
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl font-bold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('avatar-upload')?.click()}
              disabled={uploadingAvatar}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
            </Button>

            {/* Stats */}
            <div className="mt-6 space-y-2 text-center">
              <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <p className="text-2xl font-bold text-orange-400">{profile.enrollments_count || 0}</p>
                <p className="text-xs text-slate-400">Enrolled Courses</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <p className="text-2xl font-bold text-green-400">{profile.completed_courses || 0}</p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Personal Information</h2>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                  className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-900/50 border-slate-700/50 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-slate-900/50 border-slate-700/50 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-slate-300">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-slate-900/50 border-slate-700/50 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                  <Input
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="bg-slate-900/50 border-slate-700/50 text-white"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        name: profile.name || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        bio: profile.bio || ''
                      })
                    }}
                    variant="outline"
                    className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Name</p>
                    <p className="text-base font-semibold text-white">{profile.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-600/10 border border-green-600/20 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-green-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="text-base font-semibold text-white">{profile.email}</p>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-purple-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Phone</p>
                      <p className="text-base font-semibold text-white">{profile.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Joined</p>
                    <p className="text-base font-semibold text-white">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {profile.location && (
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-teal-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Location</p>
                      <p className="text-base font-semibold text-white">{profile.location}</p>
                    </div>
                  </div>
                )}

                {profile.bio && (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">Bio</p>
                    <p className="text-base text-slate-300">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
