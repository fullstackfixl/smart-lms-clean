"use client"
 
import { useState, useEffect } from "react"
import { Plus, Search } from "lucide-react"
import { getCourses } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { FlatCard } from "../../../components/org-admin/core/FlatCard"
import { TextTable, TextRow, TextCell } from "../../../components/org-admin/core/TextTable"
import { MinimalButton, MinimalInput } from "../../../components/org-admin/core/MinimalForm"
import { StatusBadge } from "../../../components/org-admin/core/StatusBadge"
import Link from "next/link"
import { toast } from "sonner"
 
export default function CoursesPage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
 
  useEffect(() => {
    if (token) loadCourses()
  }, [token])
 
  async function loadCourses() {
    setLoading(true)
    try {
      if (!token) return
      const response = await getCourses(token)
      if (response.success && response.data) {
        setCourses(Array.isArray(response.data) ? response.data : (response.data.courses || []))
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error("Failed to load organization courses")
    } finally {
      setLoading(false)
    }
  }
 
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  )
 
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Hydrating Catalog...</p>
      </div>
    )
  }
 
  const publishedCount = courses.filter(c => c.isPublished).length
  const draftCount = courses.length - publishedCount
 
  return (
    <div className="space-y-10 pb-20">
      
      {/* ─── Hero Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3B82F6] tracking-tight leading-none uppercase">Courses</h1>
            <p className="text-[14px] text-slate-500 font-medium italic">Manage your digital products and institutional curricula.</p>
         </div>
         <Link href="/instructor/courses/new">
            <MinimalButton variant="secondary" className="text-[15px]">
               Add Course
            </MinimalButton>
         </Link>
      </div>
 
      {/* ─── Metrics Matrix ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <FlatCard className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">// Published</span>
            <span className="text-2xl font-bold text-slate-900">{publishedCount}</span>
         </FlatCard>
         <FlatCard className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">// Drafts</span>
            <span className="text-2xl font-bold text-slate-900">{draftCount}</span>
         </FlatCard>
      </div>
 
      {/* ─── Product Registry ────────────────────────────────────── */}
      <div className="space-y-6">
         <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-sm">
               <MinimalInput 
                 label="" 
                 placeholder="Search by product name..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-[#F8FAFC]"
               />
            </div>
         </div>
 
         <FlatCard noPadding>
            <TextTable headers={["Course Name", "Status", "Enrollments", "Actions"]}>
               {filteredCourses.map((course) => (
                  <TextRow key={course._id}>
                     <TextCell bold className="text-[#3B82F6] uppercase italic">
                        <Link href={`/instructor/courses/${course._id}/edit`} className="hover:underline">
                           {course.title}
                        </Link>
                     </TextCell>
                     <TextCell>
                        <StatusBadge type={course.isPublished ? 'success' : 'pending'}>
                           {course.isPublished ? 'Published' : 'Draft'}
                        </StatusBadge>
                     </TextCell>
                     <TextCell className="text-[#F97316] font-bold">
                        {course.enrollmentCount || 0}
                     </TextCell>
                     <TextCell>
                        <Link href={`/instructor/courses/${course._id}/edit`}>
                           <MinimalButton variant="text" className="px-0 h-auto">Edit</MinimalButton>
                        </Link>
                     </TextCell>
                  </TextRow>
               ))}
               {filteredCourses.length === 0 && (
                  <TextRow>
                     <TextCell colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                        No courses identified in the registry. Standby for content creation.
                     </TextCell>
                  </TextRow>
               )}
            </TextTable>
         </FlatCard>
      </div>
 
    </div>
  )
}
