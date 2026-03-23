"use client"

import { ChatUser } from '../../types/messaging'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet"
import { UserAvatar } from '../ui/UserAvatar'
import { 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  BarChart3,
  User as UserIcon
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  userProfile: any // Can be extended with more specific academic info
  requesterRole: string
}

export function ProfileDrawer({ isOpen, onClose, userProfile, requesterRole }: ProfileDrawerProps) {
  const router = useRouter()
  if (!userProfile) return null

  const isAdmin = ['organization_admin', 'org_admin'].includes(userProfile.role)
  const isStudent = userProfile.role === 'student'
  const isInstructor = userProfile.role === 'instructor'

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Contact Info</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 mb-8">
          <UserAvatar
            name={userProfile.display_name || userProfile.name}
            src={userProfile.profilePicture}
            size="xl"
            className="h-32 w-32 text-4xl shadow-lg ring-4 ring-slate-50"
          />
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              {userProfile.display_name || userProfile.name}
            </h2>
            <p className={cn(
              "text-sm font-bold uppercase tracking-widest mt-1",
              userProfile.role === 'student' ? "text-orange-600" :
              (userProfile.role === 'instructor' || userProfile.role === 'teacher') ? "text-blue-600" :
              "text-purple-600"
            )}>
              {userProfile.role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* General Info */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-100">
            {userProfile.email && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Email</p>
                  <p className="text-sm font-medium text-slate-700">{userProfile.email}</p>
                </div>
              </div>
            )}
            
            {userProfile.phone && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{userProfile.phone}</p>
                </div>
              </div>
            )}

            {!userProfile.email && !userProfile.phone && (
              <p className="text-xs text-center text-slate-400 italic">No contact details shared</p>
            )}
          </div>

          {/* Academic Info for Instructors looking at Students */}
          {userProfile.academicInfo && (
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pl-1">Academic Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                  <Calendar className="h-4 w-4 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-tighter">Batch</p>
                  <p className="text-sm font-black text-blue-900">{userProfile.academicInfo.batch}</p>
                </div>
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                  <BookOpen className="h-4 w-4 text-indigo-600 mb-2" />
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-tighter">Program</p>
                  <p className="text-sm font-black text-indigo-900 truncate">{userProfile.academicInfo.program}</p>
                </div>
              </div>
            </div>
          )}

          {/* Org Admin View - Detailed Academic Data */}
          {userProfile.attendance !== undefined && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pl-1">Performance Summary</h3>
              
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 h-16 w-16 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110" />
                 <div className="flex items-center gap-4 relative">
                    <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                      {userProfile.attendance}%
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Aggregate Attendance</p>
                      <p className="text-sm font-black text-slate-900">Good standing</p>
                    </div>
                 </div>
              </div>

              {userProfile.grades && userProfile.grades.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-4 w-4 text-slate-400" />
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Grades</p>
                   </div>
                   <div className="space-y-3">
                      {userProfile.grades.map((grade: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                           <span className="text-sm font-medium text-slate-600">{grade.subjectId?.name || grade.courseId?.title || 'Assessment'}</span>
                           <span className="text-sm font-black text-slate-900">{grade.grade || grade.score}%</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-6">
            <Button 
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
               onClick={() => {
                 onClose()
                 const base = requesterRole === 'admin' ? '/org-admin' : '/instructor'
                 const path = userProfile.role === 'student' ? 'learners' : 'instructors'
                 // Adjust for instructor view where students are in /students
                 const finalPath = requesterRole === 'instructor' ? 'students' : path
                 router.push(`${base}/${finalPath}/${userProfile._id}`)
               }}
            >
              View Full Profile
            </Button>
          </div>

          {/* Role Icon and Helper Metadata */}
          <div className="pt-8 border-t border-slate-100 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
               <UserIcon className="h-3 w-3" />
               Member since 2024
             </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
