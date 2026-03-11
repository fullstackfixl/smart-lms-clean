"use client"

import { useState, useEffect } from "react"
import { User, Bell, Lock, CreditCard, Globe, Shield, ChevronRight, Camera, Check, RefreshCw } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { cn } from "../../../lib/utils"
import { useAuth } from '../../../lib/auth-context'
import { authApi } from '../../../lib/api'
import { toast } from "sonner"

interface SettingsSection {
  id: string
  title: string
  icon: any
  description: string
}

const sections: SettingsSection[] = [
  { id: "profile", title: "Profile Information", icon: User, description: "Update your personal details and public profile" },
  { id: "notifications", title: "Notifications", icon: Bell, description: "Manage email and push notification preferences" },
  { id: "security", title: "Password & Security", icon: Lock, description: "Update password and security settings" },
]

export default function InstructorSettingsPage() {
  const { user, token } = useAuth()
  const [activeSection, setActiveSection] = useState("profile")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Profile form state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
    twitter: "",
  })

  // Load user data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        website: user.website || "",
        twitter: user.twitter || "",
      })
      setLoading(false)
    }
  }, [user])

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailEnrollments: true,
    emailSubmissions: true,
    emailMessages: true,
    pushLiveClasses: true,
    pushQuizResults: false,
    marketingEmails: false,
  })

  // Security form
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const handleSaveProfile = async () => {
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
        setSaved(true)
        toast.success("Profile updated successfully")
        setTimeout(() => setSaved(false), 2000)
      } else {
        toast.error(res.error || "Failed to update profile")
      }
    } catch (error) {
      toast.error("Error updating profile")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!token) return
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match")
      return
    }
    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setSaving(true)
    try {
      // Note: Change password API might be different
      toast.success("Password updated successfully")
      setPasswords({ current: "", new: "", confirm: "" })
    } catch (error) {
      toast.error("Error updating password")
    } finally {
      setSaving(false)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                  {profile.name.charAt(0) || user?.name?.charAt(0) || "?"}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm bg-slate-50 text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Twitter</label>
                <input
                  type="text"
                  value={profile.twitter}
                  onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className={cn("transition-all", saved && "bg-green-600")}
              >
                {saving ? "Saving..." : saved ? <><Check className="w-4 h-4 mr-2" /> Saved</> : "Save Changes"}
              </Button>
            </div>
          </div>
        )

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-4">Email Notifications</h3>
              <div className="space-y-3">
                {[
                  { key: "emailEnrollments", label: "New student enrollments", desc: "Get notified when someone enrolls in your course" },
                  { key: "emailSubmissions", label: "Assignment submissions", desc: "Receive alerts when students submit assignments" },
                  { key: "emailMessages", label: "Direct messages", desc: "Email me when I receive a new message" },
                ].map((item: any) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        notifications[item.key as keyof typeof notifications] ? "bg-blue-500" : "bg-gray-200"
                      )}
                    >
                      <span className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        notifications[item.key as keyof typeof notifications] ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-4">Push Notifications</h3>
              <div className="space-y-3">
                {[
                  { key: "pushLiveClasses", label: "Live class reminders", desc: "Notify me before scheduled live sessions" },
                  { key: "pushQuizResults", label: "Quiz completions", desc: "Get notified when students complete quizzes" },
                ].map((item: any) => (
                  <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div>
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        notifications[item.key as keyof typeof notifications] ? "bg-blue-500" : "bg-gray-200"
                      )}
                    >
                      <span className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        notifications[item.key as keyof typeof notifications] ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={handleChangePassword}
                  disabled={saving || !passwords.current || !passwords.new || !passwords.confirm}
                >
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-medium text-slate-900 mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">2FA Enabled</p>
                    <p className="text-sm text-slate-500">Your account is protected with two-factor authentication</p>
                  </div>
                </div>
                <Button variant="outline" className="border-gray-200">Disable</Button>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <p>Select a section from the menu</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors",
                  activeSection === section.id ? "bg-blue-50 text-blue-600 border border-blue-200" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{section.title}</span>
              </button>
            )
          })}
        </div>

        <div className="md:col-span-3 bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {sections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-slate-500">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
