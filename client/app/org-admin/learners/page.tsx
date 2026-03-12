"use client"
 
import { useState, useEffect } from "react"
import { listStudents } from '../../../lib/services/orgAdminApi'
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton, MinimalInput } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
import { toast } from "sonner"
 
export default function LearnersPage() {
  const { token, organization } = useAuth()
  const [learners, setLearners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'
 
  useEffect(() => {
    if (token) loadLearners()
  }, [token])
 
  async function loadLearners() {
    setLoading(true)
    try {
      let response
      if (isCollege) {
        response = await collegeApi.listStudents(token!)
      } else {
        response = await listStudents(token!)
      }
      if (response.success) {
        setLearners(response.data || [])
      }
    } catch (err) {
      console.error('Error loading learners:', err)
      toast.error("Failed to load learners")
    } finally {
      setLoading(false)
    }
  }
 
  const filteredLearners = learners.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )
 
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Scanning Registry...</p>
      </div>
    )
  }
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Learners</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Manage your student roster and academic enrollments.</p>
         </div>
         <MinimalButton variant="secondary" className="text-[15px]">
            Invite Learner
         </MinimalButton>
      </div>
 
      {/* ─── Student Manager ──────────────────────────────────────── */}
      <div className="space-y-6">
         <div className="flex-1 max-w-sm">
            <MinimalInput 
              label="" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#F8FAFC]"
            />
         </div>
 
         <FlatCard noPadding>
            <TextTable headers={["Name", "Email", "Enrollment Date", "Status", "Actions"]}>
               {filteredLearners.map((learner) => (
                  <TextRow key={learner._id}>
                     <TextCell bold className="text-[#3B82F6] uppercase italic">{learner.name}</TextCell>
                     <TextCell className="text-slate-500">{learner.email}</TextCell>
                     <TextCell className="text-slate-500">{new Date(learner.createdAt).toLocaleDateString()}</TextCell>
                     <TextCell>
                        <StatusBadge type={learner.isActive ? 'success' : 'suspended'}>
                           {learner.isActive ? 'Enrolled' : 'Suspended'}
                        </StatusBadge>
                     </TextCell>
                     <TextCell>
                        <MinimalButton variant="text" className="px-0 h-auto">View Profile</MinimalButton>
                     </TextCell>
                  </TextRow>
               ))}
               {filteredLearners.length === 0 && (
                  <TextRow>
                     <TextCell colSpan={5} className="text-center py-20 text-slate-400 font-medium italic">
                        No learners identified. Invite students to begin enrollment.
                     </TextCell>
                  </TextRow>
               )}
            </TextTable>
         </FlatCard>
      </div>
 
    </div>
  )
}
