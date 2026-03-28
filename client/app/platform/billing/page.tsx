"use client"

import React from 'react'
import useSWR from 'swr'
import { 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  Wallet,
  Zap,
  TrendingUp,
  History
} from 'lucide-react'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { BasicChart } from '../../../components/platform/basic-chart'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { platformJsonFetcher } from '../../../lib/platform-fetcher'
import { PlatformErrorState } from '../../../components/platform/platform-error-state'

export default function BillingPage() {
  const { data: response, error, isLoading } = useSWR('/api/platform/billing', platformJsonFetcher)
  const stats = response?.data || null

  type Transaction = {
    _id: string
    memo?: string
    amount: number
    date: string | number | Date
  }

  if (error) {
    return <PlatformErrorState />
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 bg-gray-100" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 bg-gray-100" />)}
        </div>
        <Skeleton className="h-[400px] w-full bg-gray-100" />
      </div>
    )
  }

  const revenueData = stats?.revenueTrajectory || [
    { name: 'Mon', value: 4500 },
    { name: 'Tue', value: 5200 },
    { name: 'Wed', value: 4800 },
    { name: 'Thu', value: 6100 },
    { name: 'Fri', value: 5800 },
    { name: 'Sat', value: 7200 },
    { name: 'Sun', value: 8500 },
  ]

  const transactions = stats?.recentTransactions || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            Financial Ledger
          </h1>
          <p className="mt-2 text-slate-500">
            Monitor ecosystem-wide revenue velocity and institutional settlement flux.
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md px-6 shadow-none h-11">
          <Plus className="mr-2 h-5 w-5 stroke-[3]" /> Manual Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Gross Revenue"
          value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={CreditCard}
          trend={{ value: 14.2, isPositive: true }}
          subtitle="Total ecosystem volume"
        />
        <FlatMetricCard
          title="Active Tiers"
          value={stats?.activeSubscriptions || 0}
          icon={Zap}
          className="border-l-4 border-l-orange-500"
          subtitle="Premium institution nodes"
        />
        <FlatMetricCard
          title="Platform Share"
          value={`$${((stats?.totalRevenue || 0) * 0.15).toLocaleString()}`}
          icon={Wallet}
          className="border-l-4 border-l-green-500"
          subtitle="Direct hub contribution"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 border-gray-200 bg-white p-6 rounded-md no-shadow">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Trajectory</h3>
              <p className="text-sm text-slate-400 font-medium">Daily financial flux tracking.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-600 border-none rounded-sm px-2 py-0.5 text-[10px] font-bold">USD VOLUME</Badge>
            </div>
          </div>
          <BasicChart data={revenueData} type="bar" xKey="name" yKey="value" height={320} />
        </Card>

        <Card className="lg:col-span-4 border-orange-100 bg-orange-50/30 p-8 rounded-md no-shadow flex flex-col justify-center items-center text-center">
          <div className="h-16 w-16 bg-orange-500 text-white rounded-full flex items-center justify-center mb-6">
            <TrendingUp size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Growth Milestone</h3>
          <p className="text-sm text-slate-500 max-w-[200px]">
            The ecosystem has reached a <span className="text-orange-600 font-bold">88%</span> retention velocity this quarter.
          </p>
          <Button variant="outline" className="mt-8 border-orange-200 text-orange-600 font-bold hover:bg-orange-100 bg-white w-full">
            View Retention Audit
          </Button>
        </Card>
      </div>

      {/* Transaction Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Recent Settlements</h3>
          <Button variant="ghost" className="text-blue-500 hover:text-blue-600 font-bold h-8 p-0">
            Full Ledger <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        
        <SimpleTable headers={['Reference', 'Institution', 'Amount', 'Status', 'Date']}>
          {transactions.map((txn: Transaction) => (
            <SimpleTableRow key={txn._id}>
              <SimpleTableCell className="font-mono text-[10px] font-bold text-slate-400 tabular-nums">
                TXN-{txn._id.slice(-8).toUpperCase()}
              </SimpleTableCell>
              <SimpleTableCell className="font-bold text-blue-600">
                {txn.memo || 'Global Settlement'}
              </SimpleTableCell>
              <SimpleTableCell className="font-bold text-slate-900">
                ${txn.amount.toLocaleString()}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className="bg-green-50 text-green-600 border-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Cleared
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-right text-slate-400 font-bold text-[10px] uppercase">
                {new Date(txn.date).toLocaleDateString()}
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {transactions.length === 0 && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={5} className="text-center py-12 text-slate-400">
                <History className="mx-auto h-12 w-12 text-slate-100 mb-4" />
                <p className="font-medium">Financial data stream is currently empty.</p>
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>
    </div>
  )
}
