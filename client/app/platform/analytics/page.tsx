"use client"

import React, { useEffect, useState } from 'react'
import { 
  BarChart3, 
  Search, 
  Download, 
  Filter, 
  ArrowUpRight, 
  TrendingUp,
  Target,
  Zap,
  Clock
} from 'lucide-react'
import { 
  SimpleCard, 
  SimpleBadge, 
  FlatTable, 
  FlatTableHead, 
  FlatTableRow, 
  FlatTableCell 
} from '../../../components/platform/ui-standard'
import { BasicChart } from '../../../components/platform/chart-wrapper'
import { Button } from '../../../components/ui/button'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/platform/analytics/overview');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Analytics telemetry failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const trendData = [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 180 },
    { name: 'Wed', value: 160 },
  ]

  const metrics = [
    { label: 'Platform Users', value: stats?.usersCount || '0', trend: 'Global', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Sessions', value: stats?.activeSessions || '0', trend: 'Live', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Global Students', value: stats?.studentsCount || '0', trend: 'Growth', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Institutional Nodes', value: stats?.organizationsCount || '0', trend: 'Stable', icon: Zap, color: 'text-teal-600', bg: 'bg-teal-50' },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            Deep-Dive Analytics
          </h1>
          <p className="mt-2 text-slate-500">Universal ecosystem intelligence and performance metrics.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="text-slate-600 bg-white border-gray-200 shadow-none">
            <Filter className="mr-2 h-4 w-4" /> Date Range
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-none">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Metric Pills */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <SimpleCard key={m.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md ${m.bg} ${m.color}`}>
                <m.icon className="h-4 w-4 stroke-[1.5]" />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                {m.trend}
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{m.label}</p>
            <p className="text-xl font-bold text-slate-900">{m.value}</p>
          </SimpleCard>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SimpleCard className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Weekly User Flux</h3>
            <SimpleBadge variant="blue">Real-time Node Activity</SimpleBadge>
          </div>
          <BasicChart data={trendData} type="line" height={300} />
        </SimpleCard>

        <SimpleCard>
          <h3 className="font-semibold text-slate-900 mb-6">Regional Distribution</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">North America</span>
                <span className="font-bold text-slate-900">42%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Europe & Asia</span>
                <span className="font-bold text-slate-900">36%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-600 rounded-full" style={{ width: '36%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Other Regions</span>
                <span className="font-bold text-slate-900">22%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-600 rounded-full" style={{ width: '22%' }} />
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 italic">"Reach expanded by 8% this quarter"</p>
          </div>
        </SimpleCard>
      </div>

      {/* Top Performing Org Table */}
      <SimpleCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Top Growth Nodes</h3>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
            <input 
              type="text" 
              placeholder="Filter nodes..." 
              className="h-9 w-full rounded-md border border-gray-100 bg-gray-50 pl-8 pr-3 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-none"
            />
          </div>
        </div>
        <FlatTable>
          <FlatTableHead>
            <FlatTableRow>
              <FlatTableCell className="font-semibold text-slate-700">Institution</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Learners</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Retention</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Revenue Contribution</FlatTableCell>
              <FlatTableCell className="text-right"></FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <FlatTableRow key={i}>
                <FlatTableCell className="font-medium text-blue-600">High Growth Node 00{i}</FlatTableCell>
                <FlatTableCell className="text-slate-600">12,450</FlatTableCell>
                <FlatTableCell>
                  <SimpleBadge variant="green">94.2%</SimpleBadge>
                </FlatTableCell>
                <FlatTableCell className="font-bold text-slate-900">$45,200.00</FlatTableCell>
                <FlatTableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-blue-600 h-8 font-bold hover:bg-blue-50">Deep-Dive</Button>
                </FlatTableCell>
              </FlatTableRow>
            ))}
          </tbody>
        </FlatTable>
      </SimpleCard>
    </div>
  )
}
