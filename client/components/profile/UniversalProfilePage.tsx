"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
    User, Mail, Phone, MapPin, Calendar, Edit2, Save, X,
    Loader2, AlertCircle, Shield, GraduationCap, BookOpen, Award
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { toast } from "sonner"
import { useAuth } from '../../lib/auth-context'
import { API_URL as API } from '../../lib/config'
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    student: { label: "Student", color: "blue", icon: <GraduationCap className="h-4 w-4" /> },
    instructor: { label: "Instructor", color: "purple", icon: <BookOpen className="h-4 w-4" /> },
    org_admin: { label: "Organization Admin", color: "orange", icon: <Shield className="h-4 w-4" /> },
    platform_admin: { label: "Platform Admin", color: "red", icon: <Shield className="h-4 w-4" /> },
    parent: { label: "Parent", color: "green", icon: <User className="h-4 w-4" /> },
    support: { label: "Support", color: "teal", icon: <User className="h-4 w-4" /> },
}

// Profile endpoints — /student/profile for students, /api/users/profile for everyone else
const profileEndpoint = (role: string) => role === "student" ? "/student/profile" : "/api/users/profile"
const profileUpdateMethod = (role: string) => role === "student" ? "PATCH" : "PUT"

interface ProfileData {
    _id?: string
    name: string
    email: string
    phone?: string
    location?: string
    bio?: string
    avatar?: string
    role?: string
    created_at?: string
    // student stats
    enrollments_count?: number
    completed_courses?: number
    // instructor stats
    courses_count?: number
}

interface Props {
    role: string
}

export function UniversalProfilePage({ role }: Props) {
    const { user } = useAuth()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState({ name: "", phone: "", location: "", bio: "" })

    const fetchProfile = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const endpoint = profileEndpoint(role)
            const r = await fetch(`${API}${endpoint}`, {
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                credentials: "include"
            })
            const data = await r.json()

            if (data.success && data.data) {
                // /api/users/profile returns { user: { name, email, profile:{phone,bio,...} } }
                // /student/profile returns flat { name, email, phone, bio, ... }
                const raw = data.data.user || data.data
                const p: ProfileData = {
                    _id: raw._id,
                    name: raw.name || `${raw.profile?.firstName || ""} ${raw.profile?.lastName || ""}`.trim(),
                    email: raw.email,
                    phone: raw.phone || raw.profile?.phone || "",
                    location: raw.location || raw.profile?.location || "",
                    bio: raw.bio || raw.profile?.bio || "",
                    avatar: raw.avatar || raw.profile?.avatar || "",
                    role: raw.role,
                    created_at: raw.created_at || raw.createdAt,
                    enrollments_count: raw.enrollments_count,
                    completed_courses: raw.completed_courses,
                    courses_count: raw.courses_count,
                }
                setProfile(p)
                setForm({ name: p.name, phone: p.phone || "", location: p.location || "", bio: p.bio || "" })
            } else {
                // Fallback to auth context data so name + email always show
                if (user) {
                    const fallback: ProfileData = { name: user.name, email: user.email, role: user.role }
                    setProfile(fallback)
                    setForm({ name: user.name, phone: "", location: "", bio: "" })
                } else {
                    setError(data.message || "Failed to load profile")
                }
            }
        } catch {
            // Network error — fallback to auth context
            if (user) {
                const fallback: ProfileData = { name: user.name, email: user.email, role: user.role }
                setProfile(fallback)
                setForm({ name: user.name, phone: "", location: "", bio: "" })
            } else {
                setError("Failed to load profile")
            }
        } finally {
            setLoading(false)
        }
    }, [role, user])

    useEffect(() => { fetchProfile() }, [fetchProfile])

    const handleSave = async () => {
        setSaving(true)
        try {
            const endpoint = profileEndpoint(role)
            const method = profileUpdateMethod(role)
            // /api/users/profile uses { firstName, lastName, phone, bio }
            // /student/profile uses { name, phone, location, bio }
            const nameParts = form.name.trim().split(" ")
            const body = role === "student"
                ? form
                : { firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "", phone: form.phone, bio: form.bio }
            const r = await fetch(`${API}${endpoint}`, {
                method,
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body)
            })
            const data = await r.json()
            if (data.success) {
                toast.success("Profile updated!")
                setEditing(false)
                await fetchProfile()
            } else {
                toast.error(data.message || "Update failed")
            }
        } catch {
            toast.error("Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    const getInitials = (name: string) =>
        name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?"

    const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.student

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-64" />
                <div className="flex gap-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
            </div>
        )
    }

    if (error && !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-semibold">{error}</p>
                <Button onClick={fetchProfile}>Try Again</Button>
            </div>
        )
    }

    // Always ensure we have name + email from auth context as fallback
    const displayName = profile?.name || user?.name || "—"
    const displayEmail = profile?.email || user?.email || "—"

    return (
        <div className="space-y-8 p-6 max-w-3xl mx-auto">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-muted-foreground mt-1">View and manage your account information</p>
            </motion.div>

            {/* Profile card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            {/* Avatar */}
                            <div className="flex flex-col items-center gap-3">
                                <Avatar className="h-24 w-24 border-4 border-primary/20">
                                    {profile?.avatar && <AvatarImage src={profile.avatar} alt={displayName} />}
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                                        {getInitials(displayName)}
                                    </AvatarFallback>
                                </Avatar>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    {roleInfo.icon}
                                    {roleInfo.label}
                                </Badge>
                            </div>

                            {/* Info / Edit form */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">{displayName}</h2>
                                    {!editing ? (
                                        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                                            <Edit2 className="h-4 w-4 mr-1" /> Edit
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleSave} disabled={saving}>
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                                                Save
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm({ name: profile?.name || "", phone: profile?.phone || "", location: profile?.location || "", bio: profile?.bio || "" }) }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {editing ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <Label>Full Name</Label>
                                            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Label>Email</Label>
                                            <Input value={displayEmail} disabled className="mt-1 opacity-60" />
                                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
                                        </div>
                                        <div>
                                            <Label>Phone</Label>
                                            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." className="mt-1" />
                                        </div>
                                        <div>
                                            <Label>Location</Label>
                                            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" className="mt-1" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Label>Bio</Label>
                                            <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself..." className="mt-1" rows={3} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Name */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Full Name</p>
                                                <p className="font-semibold">{displayName}</p>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                                <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Email</p>
                                                <p className="font-semibold">{displayEmail}</p>
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        {profile?.phone && (
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                                    <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Phone</p>
                                                    <p className="font-semibold">{profile.phone}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Location */}
                                        {profile?.location && (
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                                                    <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Location</p>
                                                    <p className="font-semibold">{profile.location}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Member since */}
                                        {profile?.created_at && (
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                                                    <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Member Since</p>
                                                    <p className="font-semibold">
                                                        {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bio */}
                                        {profile?.bio && (
                                            <div className="p-3 rounded-lg bg-muted/50 mt-2">
                                                <p className="text-xs text-muted-foreground mb-1">About</p>
                                                <p className="text-sm">{profile.bio}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats cards — student only */}
            {role === "student" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-bold">{profile?.enrollments_count ?? 0}</p>
                            <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{profile?.completed_courses ?? 0}</p>
                            <p className="text-sm text-muted-foreground">Completed</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Instructor stats */}
            {role === "instructor" && profile?.courses_count !== undefined && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-bold">{profile.courses_count}</p>
                            <p className="text-sm text-muted-foreground">Courses Created</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    )
}
