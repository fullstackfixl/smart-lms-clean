"use client"

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  LayoutGrid, 
  List,
  Eye,
  Users,
  ChevronRight,
  TrendingUp,
  Globe,
  MoreHorizontal
} from 'lucide-react'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from '../../../lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function CoursesPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')

  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [search, setSearch] = useState('')
  
  const { data: response, error, isLoading, mutate } = useSWR(
    `/api/platform/courses?search=${search}${organizationId ? `&organization=${organizationId}` : ''}`, 
    fetcher
  )

  const courses = response?.success ? response.data.courses : []
  const stats = response?.success ? response.data.stats : { total: 0, published: 0, enrollments: 0 }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            {organizationId ? 'Institutional Courseware' : 'Global Course Catalog'}
          </h1>
          <p className="mt-2 text-slate-500">
            {organizationId ? 'Filtering content matrix for child tenant node.' : 'Oversee cross-institutional content distribution and engagement.'}
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md px-6 shadow-none h-11">
          <Plus className="mr-2 h-5 w-5 stroke-[3]" /> Create Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Total Catalog"
          value={stats?.total || 0}
          icon={FileText}
          subtitle="Courses in database"
        />
        <FlatMetricCard
          title="Published"
          value={stats?.published || 0}
          icon={Globe}
          className="border-l-4 border-l-green-500"
          subtitle="Live across nodes"
        />
        <FlatMetricCard
          title="Total Enrollments"
          value={stats?.enrollments || 0}
          icon={Users}
          trend={{ value: 8.4, isPositive: true }}
          className="border-l-4 border-l-orange-500"
          subtitle="Students learning"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-md border border-gray-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 stroke-[2]" />
          <input
            type="text"
            placeholder="Search by title, instructor, or institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-gray-100 rounded-md border border-gray-200">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setView('grid')}
              className={cn("h-8 w-8 p-0 rounded", view === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setView('table')}
              className={cn("h-8 w-8 p-0 rounded", view === 'table' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" className="text-slate-500 hover:text-blue-600 font-bold h-10 px-4">
            <Filter className="mr-2 h-4 w-4" /> More Filters
          </Button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: any) => (
            <Card key={course._id} className="border-gray-200 p-0 rounded-md overflow-hidden no-shadow group hover:border-blue-500 transition-all">
              <div className="aspect-video bg-gray-50 relative overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <FileText size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    course.status === 'published' ? "bg-green-100/90 text-green-700 backdrop-blur-sm" : "bg-orange-100/90 text-orange-700 backdrop-blur-sm"
                  )}>
                    {course.status}
                  </Badge>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h4>
                <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {course.organization_id?.name || 'Global'}
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                  <div className="flex items-center text-xs font-bold text-slate-600">
                    <Users className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
                    {course.enrollmentCount || 0} <span className="ml-1 text-slate-400">Learners</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 font-bold p-0 px-2 h-8">
                    Monitor <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {courses.length === 0 && !isLoading && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-md">
              <FileText className="mx-auto h-12 w-12 text-slate-200 mb-4" />
              <p className="text-slate-400 font-medium">No courses found matching your criteria.</p>
            </div>
          )}
        </div>
      ) : (
        <SimpleTable headers={['Course Title', 'Institution', 'Status', 'Enrollments', 'Actions']}>
          {courses.map((course: any) => (
            <SimpleTableRow key={course._id}>
              <SimpleTableCell className="font-bold text-blue-600 hover:underline cursor-pointer">
                {course.title}
              </SimpleTableCell>
              <SimpleTableCell className="text-slate-500 font-medium">
                {course.organization_id?.name || 'Platform'}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  course.status === 'published' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                )}>
                  {course.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="font-bold text-slate-700">
                {course.enrollmentCount || 0}
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-none p-1">
                    <DropdownMenuItem className="cursor-pointer text-slate-700 focus:bg-blue-50 focus:text-blue-600 py-2">
                      <Eye className="mr-2 h-4 w-4" /> Preview Content
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-slate-700 focus:bg-blue-50 focus:text-blue-600 py-2">
                       <Users className="mr-2 h-4 w-4" /> View Enrollments
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-2">
                       Suppres Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        </SimpleTable>
      )}
    </div>
  )
}
