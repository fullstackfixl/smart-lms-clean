"use client"

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  LayoutGrid, 
  List,
  Eye,
  Users,
  ChevronRight
} from 'lucide-react'
import { 
  SimpleCard, 
  SimpleBadge, 
  FlatTable, 
  FlatTableHead, 
  FlatTableRow, 
  FlatTableCell 
} from '../../../components/platform/ui-standard'
import { Button } from '../../../components/ui/button'

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')

  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        let url = `/api/platform/courses?search=${search}`
        if (organizationId) url += `&organization=${organizationId}`
        
        const response = await fetch(url)
        const data = await response.json()
        if (data.success) {
          setCourses(data.data.courses)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(() => {
      fetchCourses()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, organizationId])

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            {organizationId ? 'Institutional Courseware' : 'Global Course Catalog'}
          </h1>
          <p className="mt-2 text-slate-500">
            {organizationId ? 'Filtering product matrix for child tenant node.' : 'Cross-institutional content oversight and scalability.'}
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-none">
          <Plus className="mr-2 h-4 w-4" /> Create Global Course
        </Button>
      </div>

      {/* Logic Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Identify course by title, ID, or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2 rounded-md border border-gray-200 bg-white p-1">
          <Button 
            variant={view === 'grid' ? 'default' : 'ghost'} 
            size="sm" 
            className={view === 'grid' ? 'bg-blue-50 text-blue-600 shadow-none hover:bg-blue-50 font-bold' : 'text-slate-500'}
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={view === 'table' ? 'default' : 'ghost'} 
            size="sm" 
            className={view === 'table' ? 'bg-blue-50 text-blue-600 shadow-none hover:bg-blue-50 font-bold' : 'text-slate-500'}
            onClick={() => setView('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-md bg-gray-100" />
            ))
          ) : courses.length === 0 ? (
            <div className="col-span-full h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-gray-200 rounded-md">
              No courses identified in the global catalog.
            </div>
          ) : (
            courses.map((course) => (
              <SimpleCard key={course._id} className="group hover:border-blue-300">
                <div className="aspect-video w-full rounded-md bg-gray-100 mb-4 overflow-hidden relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <FileText className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <SimpleBadge variant={course.status === 'published' ? 'green' : 'orange'}>
                      {course.status}
                    </SimpleBadge>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h4>
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{course.organization_id?.name || 'Platform'}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-slate-600">
                    <Users className="mr-2 h-4 w-4 text-orange-600" />
                    {course.enrollmentCount || 0} Learners
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 h-8">
                    Manage <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </SimpleCard>
            ))
          )}
        </div>
      ) : (
        <SimpleCard className="p-0 overflow-hidden">
          <FlatTable>
            <FlatTableHead>
              <FlatTableRow>
                <FlatTableCell className="font-semibold text-slate-700">Course Matrix</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Provider</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Category</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Learners</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Status</FlatTableCell>
                <FlatTableCell className="text-right"></FlatTableCell>
              </FlatTableRow>
            </FlatTableHead>
            <tbody>
              {courses.map((course) => (
                <FlatTableRow key={course._id}>
                  <FlatTableCell className="font-medium text-blue-600 underline-offset-4 hover:underline cursor-pointer">
                    {course.title}
                  </FlatTableCell>
                  <FlatTableCell className="text-slate-600">{course.organization_id?.name || 'Platform'}</FlatTableCell>
                  <FlatTableCell className="text-slate-500">{course.category}</FlatTableCell>
                  <FlatTableCell className="text-slate-900 font-semibold">{course.enrollmentCount || 0}</FlatTableCell>
                  <FlatTableCell>
                    <SimpleBadge variant={course.status === 'published' ? 'green' : 'orange'}>
                      {course.status}
                    </SimpleBadge>
                  </FlatTableCell>
                  <FlatTableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </FlatTableCell>
                </FlatTableRow>
              ))}
            </tbody>
          </FlatTable>
        </SimpleCard>
      )}
    </div>
  )
}
