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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DashboardPage() {
  const { data: response, error, isLoading } = useSWR('/api/platform/dashboard', fetcher)
  const stats = response?.success ? response.data : null

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
      {/* Hero Header */}
      <section>
        <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
          Platform Dashboard
        </h1>
        <p className="mt-2 text-slate-500 max-w-2xl">
          Aggregate ecosystem data. Real-time overview of your institutions, enrollment trends, and platform-wide user health.
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
        <Card className="border-gray-200 bg-white p-6 rounded-md no-shadow">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Enrollment Growth</h3>
            <div className="flex items-center text-xs font-medium text-blue-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +18% this week
            </div>
          </div>
          <BasicChart data={enrollmentData} type="line" xKey="name" yKey="value" height={280} />
        </Card>

        <Card className="border-gray-200 bg-white p-6 rounded-md no-shadow">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Platform Distribution</h3>
            <Button variant="ghost" size="sm" className="text-blue-500 hover:bg-blue-50 font-bold h-8">
              View Analytics <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <BasicChart data={growthData} type="bar" xKey="name" yKey="value" height={280} />
        </Card>
      </div>

      {/* Recent Onboardings Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Recent Onboardings</h3>
          <Button variant="ghost" className="text-orange-500 hover:text-orange-600 font-bold p-0 h-auto">
            View All Reports
          </Button>
        </div>
        
        <SimpleTable headers={['Institution', 'Type', 'Status', 'Onboarded', 'Actions']}>
          {(stats?.recentActivity?.organizations || []).slice(0, 5).map((org: any) => (
            <SimpleTableRow key={org._id}>
              <SimpleTableCell className="font-bold text-blue-600">
                {org.name}
              </SimpleTableCell>
              <SimpleTableCell>
                <span className="text-slate-500">{org.type}</span>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  org.status === 'active' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                )}>
                  {org.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-slate-400 font-medium">
                {new Date(org.created_at).toLocaleDateString()}
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-blue-500">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {(!stats?.recentActivity?.organizations || stats.recentActivity.organizations.length === 0) && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={5} className="text-center py-8 text-slate-400">
                No recent activity found.
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>
    </div>
  )
}
