"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  BookOpen, 
  User as UserIcon,
  Shield,
  GraduationCap,
  Activity,
  Award,
  BarChart3,
  MessageSquare,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { UserAvatar } from '../ui/UserAvatar'
import { cn } from '../../lib/utils'
import { messagingApi, platformApi, collegeApi } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { toast } from 'sonner'

interface UserProfileDetailProps {
  userId: string
  source: 'org-admin' | 'platform' | 'instructor'
}

export function UserProfileDetail({ userId, source }: UserProfileDetailProps) {
  const router = useRouter()
  const { token, user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (token && userId) {
      fetchProfile()
    }
  }, [token, userId])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      let res;
      if (source === 'platform') {
        const tokenStr = localStorage.getItem('token') // Standard token for platform
        res = await platformApi.getUserDetails(tokenStr || '', userId)
      } else {
        // Use messaging profile API for college context (Org Admin & Instructor)
        res = await messagingApi.getUserProfile(token!, userId)
      }

      if (res.success && res.data) {
        setProfileData(res.data)
      } else {
        toast.error(res.message || "Failed to load profile")
      }
    } catch (err) {
      console.error("Profile fetch error:", err)
      toast.error("Error loading user profile")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!token || !profileData) return
    setActionLoading(true)
    try {
      const newStatus = profileData.status === 'active' ? 'suspend' : 'activate'
      let res;
      if (source === 'platform') {
          // Add platform suspend/activate if needed
      }
      // Refresh after action
      fetchProfile()
    } catch (err) {
      toast.error("Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartChat = async () => {
    if (!token) return
    const toastId = toast.loading("Opening chat...")
    try {
      const res = await messagingApi.startConversation(token, userId)
      if (res.success && res.data) {
        const conv = res.data as any
        toast.success("Redirecting...", { id: toastId })
        const base = source === 'org-admin' ? '/org-admin' : '/instructor'
        router.push(`${base}/messages?conversation=${conv._id}`)
      }
    } catch (err) {
      toast.error("Failed to start chat", { id: toastId })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Retrieving identity data...</p>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
           <UserIcon className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">User Not Found</h2>
        <p className="text-slate-500 mt-1 max-w-xs">The identity you are looking for might have been removed or reorganized.</p>
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          className="mt-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  const role = profileData.role || 'user'
  const isStudent = role === 'student'
  const isInstructor = role === 'instructor' || role === 'teacher'
  const isAdmin = ['org_admin', 'organization_admin'].includes(role)

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
      >
        <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition-all">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold uppercase tracking-widest">Back to Directory</span>
      </button>

      {/* Profile Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 h-64 w-64 bg-slate-50 rounded-bl-full -mr-20 -mt-20 pointer-events-none opacity-50" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
          <div className="relative">
            <UserAvatar
              name={profileData.name || `${profileData.firstName} ${profileData.lastName}`}
              src={profileData.profilePicture}
              size="xl"
              className="h-40 w-40 text-5xl shadow-2xl ring-4 ring-white"
            />
            <div className={cn(
               "absolute -bottom-2 -right-2 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg",
               isStudent ? "bg-orange-500" : isInstructor ? "bg-blue-600" : "bg-purple-600"
            )}>
               {isStudent ? <GraduationCap className="h-5 w-5" /> : isInstructor ? <Shield className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left pt-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {profileData.name || `${profileData.firstName} ${profileData.lastName}`}
              </h1>
              <Badge className={cn(
                "w-fit mx-auto md:mx-0 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                isStudent ? "bg-orange-100 text-orange-700" : isInstructor ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
              )}>
                {role.replace('_', ' ')}
              </Badge>
            </div>
            
            <p className="text-slate-500 text-lg flex items-center justify-center md:justify-start gap-2 mb-6">
              <Mail className="h-4 w-4 opacity-50" />
              {profileData.email}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               {source !== 'platform' && (
                 <Button 
                   onClick={handleStartChat}
                   className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-6 h-auto shadow-lg shadow-blue-200 transition-all active:scale-95"
                 >
                   <MessageSquare className="mr-2 h-5 w-5" /> Message Now
                 </Button>
               )}
               <Button 
                 variant="outline"
                 className="rounded-xl px-6 py-6 h-auto border-slate-200 hover:bg-slate-50 font-bold transition-all text-slate-700"
               >
                 Edit Identity
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Identity Information Section */}
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
               <UserIcon className="h-4 w-4 text-slate-400" /> Identity Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Contact Email</p>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{profileData.email}</span>
                 </div>
               </div>

               {profileData.phone && (
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Phone Number</p>
                   <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{profileData.phone}</span>
                   </div>
                 </div>
               )}

               <div className="md:col-span-2">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Home Location</p>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{profileData.address || 'Not verified'}</span>
                 </div>
               </div>
            </div>
          </section>

          {/* Academic Context Section */}
          {(profileData.academicInfo || profileData.profile) && (
            <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-400" /> Academic Context
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 relative overflow-hidden group">
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Assigned Batch</p>
                      <p className="text-xl font-black text-blue-900">{profileData.academicInfo?.batch || profileData.profile?.batch || 'N/A'}</p>
                    </div>
                    <Calendar className="absolute -bottom-2 -right-2 h-16 w-16 text-blue-100 transition-transform group-hover:scale-110" />
                 </div>

                 <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100/50 relative overflow-hidden group">
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Academic Program</p>
                      <p className="text-xl font-black text-purple-900">{profileData.academicInfo?.program || profileData.profile?.program_id || 'Not Assigned'}</p>
                    </div>
                    <BookOpen className="absolute -bottom-2 -right-2 h-16 w-16 text-purple-100 transition-transform group-hover:scale-110" />
                 </div>
              </div>
            </section>
          )}

          {/* Performance Summary (Admin/Instructor View only) */}
          {profileData.attendance !== undefined && (
            <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" /> Performance Tracking
              </h3>
              
              <div className="space-y-8">
                 <div className="flex items-center gap-6">
                    <div className={cn(
                      "h-24 w-24 rounded-full border-8 flex items-center justify-center text-xl font-black",
                      profileData.attendance > 75 ? "border-green-100 text-green-600" : "border-orange-100 text-orange-600"
                    )}>
                      {profileData.attendance}%
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">Aggregate Attendance</p>
                      <p className="text-sm text-slate-500 max-w-sm">
                        Based on records since starting the current semester. 
                        Target visibility is 75% for exam eligibility.
                      </p>
                    </div>
                 </div>

                 {profileData.grades && profileData.grades.length > 0 && (
                   <div className="space-y-4 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recent Subject Grades</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {profileData.grades.map((grade: any, i: number) => (
                           <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 border-l-4 border-l-blue-500">
                              <span className="text-sm font-bold text-slate-700 truncate mr-4">
                                {grade.subjectId?.name || grade.courseId?.title || 'Assessment Node'}
                              </span>
                              <Badge className="bg-white text-blue-600 border border-blue-100 font-black">
                                {grade.grade || grade.score}%
                              </Badge>
                           </div>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
            </section>
          )}

        </div>

        {/* Right Column - Status & Meta */}
        <div className="space-y-8">
           <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Node Security</h3>
              
              <div className="space-y-6">
                 <div>
                    <p className="text-xs font-bold text-slate-500 mb-2 px-1">Status Environment</p>
                    <div className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border",
                      profileData.status === 'active' ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                    )}>
                       <div className="flex items-center gap-3">
                          <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse", profileData.status === 'active' ? "bg-green-500" : "bg-red-500")} />
                          <span className={cn("text-xs font-black uppercase tracking-widest", profileData.status === 'active' ? "text-green-700" : "text-red-700")}>
                            {profileData.status || 'Active'}
                          </span>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={handleStatusToggle}
                         disabled={actionLoading}
                         className="h-8 text-[10px] font-black uppercase tracking-tighter"
                       >
                         {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Override'}
                       </Button>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-50 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-tighter">Identity ID</span>
                       <span className="text-slate-900 font-medium font-mono">{profileData._id.substring(0, 12)}...</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-tighter">Registry Node</span>
                       <span className="text-slate-900 font-medium">Global Federated Cluster</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-tighter">System Access</span>
                       <span className="text-slate-900 font-medium">{profileData.last_login ? new Date(profileData.last_login).toLocaleDateString() : 'Never logged in'}</span>
                    </div>
                 </div>
              </div>
           </section>

           <section className="bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-100 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="relative z-10">
                <Award className="h-8 w-8 text-blue-200 mb-4" />
                <h4 className="text-lg font-black leading-tight mb-2">Verified Academic Record</h4>
                <p className="text-blue-100 text-xs leading-relaxed opacity-80">
                   This identity is bound to a verified institutional email and academic program. 
                   Data is synchronized across the central registry.
                </p>
              </div>
           </section>
        </div>
      </div>
    </div>
  )
}
