"use client"

import React, { useEffect, useState } from 'react'
import { 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  Download,
  Calendar,
  Wallet,
  Zap,
  TrendingUp
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

export default function BillingPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const response = await fetch('/api/platform/billing');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Billing telemetry failed:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const revenueData = stats?.revenueTrajectory || [
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
  ]

  const invoices = [
    { id: 'INV-001', org: 'Stanford Academy', amount: '$1,200', status: 'paid', date: '2024-03-01' },
    { id: 'INV-002', org: 'MIT Global', amount: '$2,450', status: 'pending', date: '2024-03-05' },
    { id: 'INV-003', org: 'EduStream', amount: '$890', status: 'paid', date: '2024-03-07' },
    { id: 'INV-004', org: 'TechInstitute', amount: '$1,100', status: 'overdue', date: '2024-02-28' },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            Billing & Revenue
          </h1>
          <p className="mt-2 text-slate-500">Ecosystem-wide financial ledger and subscription management.</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-none">
          <Plus className="mr-2 h-4 w-4" /> Create Manual Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SimpleCard className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <CreditCard className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Gross Ecosystem Revenue</p>
            <p className="text-2xl font-bold text-slate-900">${stats?.totalRevenue?.toLocaleString() || '0'}</p>
          </div>
        </SimpleCard>
        
        <SimpleCard className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-orange-600">
            <Zap className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Subscriptions</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.activeSubscriptions || 0}</p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-50 text-green-600">
            <TrendingUp className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Flux Retention</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.retentionRate || 0}%</p>
          </div>
        </SimpleCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SimpleCard className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Revenue Trajectory</h3>
              <p className="text-sm text-slate-500">Gross revenue across all institutions</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">${stats?.totalRevenue?.toLocaleString() || '0'}</p>
            </div>
          </div>
          <BasicChart data={revenueData} type="bar" height={280} />
        </SimpleCard>

        <div className="space-y-6">
          <SimpleCard className="bg-blue-600 text-white border-none">
            <div className="flex items-center justify-between">
              <Wallet className="h-6 w-6 opacity-80" />
              <SimpleBadge variant="orange" className="bg-orange-500 text-white border-none">Platform Hub</SimpleBadge>
            </div>
            <div className="mt-6">
              <p className="text-xs opacity-70 uppercase font-bold tracking-wider">Settlement Volume</p>
              <p className="text-3xl font-bold mt-1">${(stats?.totalRevenue * 0.9).toLocaleString() || '0'}</p>
            </div>
          </SimpleCard>
        </div>
      </div>

      <SimpleCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
            <Download className="mr-2 h-4 w-4" /> Export Ledger
          </Button>
        </div>
        <FlatTable>
          <FlatTableHead>
            <FlatTableRow>
              <FlatTableCell className="font-semibold text-slate-700">Transaction ID</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Description</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Date</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Amount</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Status</FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {(stats?.recentTransactions || []).map((t: any) => (
              <FlatTableRow key={t._id}>
                <FlatTableCell className="font-mono text-xs font-bold text-slate-900">TXN-{t._id.slice(-6).toUpperCase()}</FlatTableCell>
                <FlatTableCell className="font-medium text-blue-600">{t.memo}</FlatTableCell>
                <FlatTableCell className="text-slate-500 text-sm">{new Date(t.date).toLocaleDateString()}</FlatTableCell>
                <FlatTableCell className="font-bold text-slate-900">${t.amount.toLocaleString()}</FlatTableCell>
                <FlatTableCell>
                  <SimpleBadge variant="green">PAID</SimpleBadge>
                </FlatTableCell>
              </FlatTableRow>
            ))}
          </tbody>
        </FlatTable>
      </SimpleCard>
    </div>
  )
}
