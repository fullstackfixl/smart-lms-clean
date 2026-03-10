"use client"

import React from 'react'
import useSWR from 'swr'
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Activity,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { BasicChart } from '../../../components/platform/basic-chart'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data: response, error, isLoading } = useSWR('/api/platform/dashboard', fetcher)
  const stats = response?.data || null

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 bg-gray-100" />
          <Skeleton className="mt-2 h-4 w-96 bg-gray-50" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-md bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px] rounded-md bg-gray-100" />
          <Skeleton className="h-[350px] rounded-md bg-gray-100" />
        </div>
      </div>
    )
  }

  const enrollmentData = stats?.enrollmentFlux || [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 150 },
    { name: 'Wed', value: 180 },
    { name: 'Thu', value: 140 },
    { name: 'Fri', value: 210 },
    { name: 'Sat', value: 190 },
    { name: 'Sun', value: 230 },
  ]

  const growthData = [
    { name: 'Students', value: stats?.totalStudents || 0 },
    { name: 'Institutions', value: stats?.totalOrganizations || 0 },
    { name: 'Courses', value: stats?.totalCourses || 0 },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-semibold text-slate-900">
          Platform Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Overview of organizations, users, and courses across the platform
        </p>
      </section>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <FlatMetricCard
          title="Total Organizations"
          value={stats?.totalOrganizations || 0}
          icon={Building2}
          trend={{ value: 5.2, isPositive: true }}
          subtitle="Registered institutions"
        />
        <FlatMetricCard
          title="Active Users"
          value={stats?.activeUsersToday || 0}
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
          subtitle="Today's activity"
        />
        <FlatMetricCard
          title="Total Courses"
          value={stats?.totalCourses || 0}
          icon={FileText}
          subtitle="Across all orgs"
        />
        <FlatMetricCard
          title="Active Today"
          value={stats?.activeSessions || 0}
          icon={Activity}
          subtitle="Concurrent users"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-gray-200 bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Enrollment Growth</h3>
            <div className="flex items-center text-xs font-medium text-emerald-600">
              <TrendingUp className="mr-1 h-3.5 w-3.5" />
              +18% this week
            </div>
          </div>
          <BasicChart data={enrollmentData} type="line" xKey="name" yKey="value" height={280} />
        </Card>

        <Card className="border-gray-200 bg-white p-6 rounded-lg shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Platform Distribution</h3>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 h-8 text-xs">
              View Analytics <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <BasicChart data={growthData} type="bar" xKey="name" yKey="value" height={280} />
        </Card>
      </div>

      {/* Recent Organizations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Recent Organizations</h3>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto text-sm">
            View All
          </Button>
        </div>
        
        <SimpleTable headers={['Organization', 'Type', 'Status', 'Created', 'Actions']}>
          {(stats?.recentActivity?.organizations || []).slice(0, 5).map((org: any) => (
            <SimpleTableRow key={org._id}>
              <SimpleTableCell className="font-medium text-slate-900">
                {org.name}
              </SimpleTableCell>
              <SimpleTableCell>
                <span className="text-slate-600 text-sm">{org.type}</span>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  org.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  {org.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-slate-600 text-sm">
                {new Date(org.created_at).toLocaleDateString()}
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {(!stats?.recentActivity?.organizations || stats.recentActivity.organizations.length === 0) && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={5} className="text-center py-8 text-slate-500">
                No organizations found
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>
    </div>
  )
}
