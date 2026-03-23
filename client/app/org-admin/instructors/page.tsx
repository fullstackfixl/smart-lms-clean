"use client"
 
import { useState, useEffect } from "react"
import { listInstructors } from '../../../lib/services/orgAdminApi'
import { collegeApi, messagingApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton, MinimalInput } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MessageSquare } from "lucide-react"
import { UserAvatar } from "../../../components/ui/UserAvatar"
 
export default function InstructorsPage() {
  const { token, organization } = useAuth()
  const router = useRouter()
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'
 
  useEffect(() => {
    if (token) loadInstructors()
  }, [token])
 
  async function loadInstructors() {
    setLoading(true)
    try {
      let response
      if (isCollege) {
        response = await collegeApi.listInstructors(token!)
      } else {
        response = await listInstructors(token!)
      }
      if (response.success) {
        setInstructors(response.data || [])
      }
    } catch (err) {
      console.error('Error loading instructors:', err)
      toast.error("Failed to load instructors")
    } finally {
      setLoading(false)
    }
  }
 
  const filteredInstructors = instructors.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStartChat = async (instructorId: string) => {
    if (!token) return
    try {
      const res = await messagingApi.startConversation(token, instructorId)
      if (res.success && res.data) {
        const conv = res.data as any
        router.push(`/org-admin/messages?conversation=${conv._id}`)
      } else {
        toast.error(res.error || "Failed to start conversation")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }
 
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Identifying Faculty Nodes...</p>
      </div>
    )
  }
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Instructors</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Manage your institutional faculty and expert assignments.</p>
         </div>
         <MinimalButton variant="secondary" className="text-[15px]">
            Add Instructor
         </MinimalButton>
      </div>
 
      {/* ─── Teacher Registry ─────────────────────────────────────── */}
      <div className="space-y-6">
         <div className="flex-1 max-w-sm">
            <MinimalInput 
              label="" 
              placeholder="Search by faculty name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#F8FAFC]"
            />
         </div>
 
         <FlatCard noPadding>
            <TextTable headers={["Name", "Courses Assigned", "Status", "Actions"]}>
               {filteredInstructors.map((instructor) => (
                  <TextRow key={instructor._id}>
                     <TextCell bold>
                        <div className="flex items-center gap-2">
                           <UserAvatar name={instructor.name} src={instructor.profilePicture} size="sm" />
                           <span 
                             className="text-[#3B82F6] uppercase italic hover:underline cursor-pointer transition-all"
                             onClick={() => router.push(`/org-admin/instructors/${instructor._id}`)}
                           >
                             {instructor.name}
                           </span>
                        </div>
                     </TextCell>
                     <TextCell className="text-slate-500">{instructor.coursesCount || 0} Products</TextCell>
                     <TextCell>
                        <StatusBadge type='success'>Verified</StatusBadge>
                     </TextCell>
                     <TextCell>
                        <div className="flex items-center gap-3">
                           <MinimalButton variant="text" className="px-0 h-auto text-slate-400 hover:text-slate-600">Edit</MinimalButton>
                           <button 
                             onClick={() => handleStartChat(instructor._id)}
                             className="text-[11px] font-black text-blue-600 flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1 rounded transition-colors uppercase tracking-wider"
                           >
                             <MessageSquare className="w-3.5 h-3.5" />
                             Chat
                           </button>
                        </div>
                     </TextCell>
                  </TextRow>
               ))}
               {filteredInstructors.length === 0 && (
                  <TextRow>
                     <TextCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                        No instructors identified. Add faculty members to begin assignments.
                     </TextCell>
                  </TextRow>
               )}
            </TextTable>
         </FlatCard>
      </div>
 
    </div>
  )
}
