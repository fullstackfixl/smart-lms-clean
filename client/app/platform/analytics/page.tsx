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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AnalyticsPage() {
  const { data: response, error, isLoading } = useSWR('/api/platform/analytics/overview', fetcher)
  const stats = response?.data || null

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

  const enrollmentTrend = stats?.enrollmentTrend || [
    { date: '2026-03-01', value: 450 },
    { date: '2026-03-02', value: 520 },
    { date: '2026-03-03', value: 480 },
    { date: '2026-03-04', value: 610 },
    { date: '2026-03-05', value: 580 },
    { date: '2026-03-06', value: 720 },
    { date: '2026-03-07', value: 850 },
  ]

  const topNodes = stats?.topNodes || []

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
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 shadow-none">
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
          value="68.4%"
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
          <BasicChart data={enrollmentTrend} type="line" xKey="date" yKey="value" height={320} />
        </Card>

        <Card className="lg:col-span-4 border-gray-200 bg-white p-6 rounded-md no-shadow flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-bold">Regional Distribution</h3>
          <div className="flex-1 space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-slate-500">North America</span>
                <span className="text-slate-900">42%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-slate-500">Europe & Asia</span>
                <span className="text-slate-900">36%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '36%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-slate-500">Other Clusters</span>
                <span className="text-slate-900">22%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-slate-400 italic">"Global reach expanded by 8% this quarter"</p>
          </div>
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
