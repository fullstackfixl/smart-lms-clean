"use client"

import React from 'react'
import useSWR from 'swr'
import { 
  BarChart3, 
  Search, 
  Download, 
  Filter, 
  ArrowUpRight, 
  TrendingUp,
  Target,
  Zap,
  Clock,
  Globe,
  MoreHorizontal
} from 'lucide-react'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { BasicChart } from '../../../components/platform/basic-chart'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { platformJsonFetcher } from '../../../lib/platform-fetcher'
import { PlatformErrorState } from '../../../components/platform/platform-error-state'
import { cn } from '../../../lib/utils'

export default function AnalyticsPage() {
  const { data: response, error, isLoading } = useSWR<any>('/api/platform/analytics/overview', platformJsonFetcher)
  const stats = response?.data || null

  if (error) {
    return <PlatformErrorState />
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 bg-gray-100" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 bg-gray-100" />)}
        </div>
        <Skeleton className="h-[400px] w-full bg-gray-100" />
      </div>
    )
  }

  const enrollmentTrend = Array.isArray(stats?.enrollmentTrend) ? stats.enrollmentTrend : []
  const topNodes = Array.isArray(stats?.topNodes) ? stats.topNodes : []
  const regionalDistribution = Array.isArray(stats?.regionalDistribution) ? stats.regionalDistribution : []
  const avgProgress = typeof stats?.avgProgress === 'number' ? stats.avgProgress : null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            Ecosystem Analytics
          </h1>
          <p className="mt-2 text-slate-500">
            Real-time telemetry and growth metrics across all institutional segments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-gray-300 text-slate-600 font-bold h-10 px-4">
            <Filter className="mr-2 h-4 w-4" /> Last 30 Days
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 px-4 shadow-none">
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <FlatMetricCard
          title="Global Learners"
          value={stats?.totalStudents || 0}
          icon={Target}
          trend={{ value: 12.4, isPositive: true }}
          subtitle="Unique identity count"
        />
        <FlatMetricCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={Clock}
          trend={{ value: 5.2, isPositive: true }}
          subtitle="Concurrent users"
        />
        <FlatMetricCard
          title="Content Volume"
          value={stats?.totalLessons || 0}
          icon={Zap}
          subtitle="Total learning assets"
        />
        <FlatMetricCard
          title="Avg Progress"
          value={avgProgress !== null ? `${avgProgress.toFixed(1)}%` : 0}
          icon={TrendingUp}
          trend={{ value: 2.1, isPositive: true }}
          subtitle="Completion efficiency"
        />
      </div>

      {/* Charts Layer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-gray-200 bg-white p-6 rounded-md no-shadow">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Universal Growth Matrix</h3>
              <p className="text-sm text-slate-400 font-medium">Daily enrollment flux across the platform.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-600 border-none rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase">Enrollments</Badge>
            </div>
          </div>
          {enrollmentTrend.length > 0 ? (
            <BasicChart data={enrollmentTrend} type="line" xKey="date" yKey="value" height={320} />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-slate-500">
              No analytics data available.
            </div>
          )}
        </Card>

        <Card className="lg:col-span-4 border-gray-200 bg-white p-6 rounded-md no-shadow flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-bold">Regional Distribution</h3>
          <div className="flex-1 space-y-8">
            {regionalDistribution.length > 0 ? (
              regionalDistribution.map((region: any, idx: number) => {
                const name = region?.name || region?.region || `Region ${idx + 1}`
                const percent = typeof region?.percent === 'number' ? region.percent : (typeof region?.value === 'number' ? region.value : 0)
                const color = idx % 3 === 0 ? 'bg-blue-500' : (idx % 3 === 1 ? 'bg-orange-500' : 'bg-green-500')
                return (
                  <div key={String(name)} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-500">{name}</span>
                      <span className="text-slate-900">{percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-slate-500">
                No regional breakdown available.
              </div>
            )}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center" />
        </Card>
      </div>

      {/* Top Nodes Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Top Performing Nodes</h3>
          <Button variant="ghost" className="text-blue-500 hover:text-blue-600 font-bold h-8 p-0">
            Full Growth Report <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <SimpleTable headers={['Institution', 'Learners', 'Course Volume', 'Retention', 'Stability']}>
          {topNodes.map((node: any) => (
            <SimpleTableRow key={node._id}>
              <SimpleTableCell className="font-bold text-blue-600">
                {node.name}
              </SimpleTableCell>
              <SimpleTableCell className="font-medium text-slate-700">
                {node.studentsCount?.toLocaleString()}
              </SimpleTableCell>
              <SimpleTableCell className="text-slate-500">
                {node.coursesCount} assets
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-green-50 text-green-600 border-none rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {node.retention}%
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                <div className="flex items-center justify-end text-emerald-500 font-bold text-xs">
                  <TrendingUp className="mr-1 h-3 w-3" /> HIGH
                </div>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {topNodes.length === 0 && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={5} className="text-center py-12 text-slate-400">
                No high-growth nodes identified in current period.
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>
    </div>
  )
}
