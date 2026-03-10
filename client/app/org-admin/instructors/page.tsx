"use client"
 
import { useState, useEffect } from "react"
import { listInstructors } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton, MinimalInput } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
import { toast } from "sonner"
 
export default function InstructorsPage() {
  const { token } = useAuth()
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
 
  useEffect(() => {
    if (token) loadInstructors()
  }, [token])
 
  async function loadInstructors() {
    setLoading(true)
    try {
      const response = await listInstructors(token!)
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
                     <TextCell bold className="text-[#3B82F6] uppercase italic">{instructor.name}</TextCell>
                     <TextCell className="text-slate-500">{instructor.coursesCount || 0} Products</TextCell>
                     <TextCell>
                        <StatusBadge type='success'>Verified</StatusBadge>
                     </TextCell>
                     <TextCell>
                        <MinimalButton variant="text" className="px-0 h-auto">Edit</MinimalButton>
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
