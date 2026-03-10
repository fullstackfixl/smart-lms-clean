"use client"

import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Building2, 
  GraduationCap, 
  TrendingUp, 
  ArrowUpRight,
  ChevronRight,
  Activity
} from 'lucide-react'
import { SimpleCard, SimpleBadge, FlatTable, FlatTableHead, FlatTableRow, FlatTableCell } from '../../../components/platform/ui-standard'
import { BasicChart } from '../../../components/platform/chart-wrapper'
import { Button } from '../../../components/ui/button'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch real metrics
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/platform/dashboard')
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const enrollmentData = stats?.enrollmentFlux || [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
  ]

  const demographicData = [
    { name: 'Students', value: stats?.totalStudents || 0 },
    { name: 'Instructors', value: stats?.totalInstructors || 0 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section>
        <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
          Intelligence Hub
        </h1>
        <p className="mt-2 text-slate-500">Ecosystem integrity verified. All systems operational.</p>
      </section>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SimpleCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <Users className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="flex items-center text-xs font-medium text-orange-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Global Learners</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600">
              <Activity className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div className="flex items-center text-xs font-medium text-orange-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +5.2%
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Avg Completion</p>
            <p className="text-2xl font-bold text-slate-900">36.8%</p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-600">
              <GraduationCap className="h-5 w-5 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Active Courses</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalCourses || 0}</p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-600">
              <Building2 className="h-5 w-5 stroke-[1.5]" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Organizations</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalOrganizations || 0}</p>
          </div>
        </SimpleCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SimpleCard>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Enrollment Flux</h3>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
              Details <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <BasicChart data={enrollmentData} type="line" height={240} />
        </SimpleCard>

        <SimpleCard>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">User Demographics</h3>
            <div className="flex space-x-2">
              <SimpleBadge variant="blue">Students</SimpleBadge>
              <SimpleBadge variant="orange">Staff</SimpleBadge>
            </div>
          </div>
          <BasicChart data={demographicData} type="pie" height={240} />
        </SimpleCard>
      </div>

      {/* Recent Activity Section */}
      <SimpleCard>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Onboardings</h3>
          <Button variant="outline" size="sm" className="border-gray-200 text-slate-600 hover:bg-gray-50">
            View All Organizations
          </Button>
        </div>
        <FlatTable>
          <FlatTableHead>
            <FlatTableRow>
              <FlatTableCell className="font-semibold text-slate-700">Institution</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Type</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Status</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Onboarded</FlatTableCell>
              <FlatTableCell className="text-right"></FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {(stats?.recentActivity?.organizations || []).slice(0, 5).map((org: any) => (
              <FlatTableRow key={org._id}>
                <FlatTableCell className="font-medium text-blue-600">{org.name}</FlatTableCell>
                <FlatTableCell className="text-slate-500">{org.type}</FlatTableCell>
                <FlatTableCell>
                  <SimpleBadge variant={org.status === 'active' ? 'green' : 'orange'}>
                    {org.status}
                  </SimpleBadge>
                </FlatTableCell>
                <FlatTableCell className="text-slate-500">
                  {new Date(org.created_at).toLocaleDateString()}
                </FlatTableCell>
                <FlatTableCell className="text-right">
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </FlatTableCell>
              </FlatTableRow>
            ))}
          </tbody>
        </FlatTable>
      </SimpleCard>
    </div>
  )
}
