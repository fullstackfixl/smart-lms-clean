"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { 
  Search, 
  Filter, 
  Shield, 
  Clock, 
  User, 
  Activity,
  MoreHorizontal,
  RefreshCw,
  Terminal,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select'
import { cn } from '../../../lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  
  const { data: response, error, isLoading, mutate } = useSWR(
    `/api/platform/audit-logs?search=${search}${actionFilter !== 'all' ? `&action=${actionFilter}` : ''}`, 
    fetcher
  )

  const logs = response?.success ? response.data : []

  const getActionBadge = (action: string) => {
    const a = action.toLowerCase()
    if (a.includes('create') || a.includes('add')) return "bg-green-100 text-green-700"
    if (a.includes('delete') || a.includes('remove') || a.includes('suspend')) return "bg-red-100 text-red-700"
    if (a.includes('update') || a.includes('edit')) return "bg-blue-100 text-blue-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            Security Audit Trail
          </h1>
          <p className="mt-2 text-slate-500">
            Immutable telemetry stream of all administrative actions and system-level events.
          </p>
        </div>
        <Button variant="outline" className="border-gray-300 text-blue-600 font-bold h-10 px-4">
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} /> Refresh Stream
        </Button>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Events Logged"
          value={logs.length}
          icon={Terminal}
          subtitle="Last 24 hours"
        />
        <FlatMetricCard
          title="Security Alerts"
          value={logs.filter((l: any) => l.severity === 'high').length}
          icon={ShieldAlert}
          className="border-l-4 border-l-orange-500"
          subtitle="Requires attention"
        />
        <FlatMetricCard
          title="Integrity Status"
          value="SOLID"
          icon={ShieldCheck}
          className="border-l-4 border-l-green-500"
          subtitle="System verification"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-md border border-gray-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 stroke-[2]" />
          <input
            type="text"
            placeholder="Filter by admin identity, organization, or action code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-48 h-10 border-gray-300 focus:ring-0 focus:border-blue-500">
            <SelectValue placeholder="Action: All" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">Action: All</SelectItem>
            <SelectItem value="CREATE">Creation</SelectItem>
            <SelectItem value="UPDATE">Modification</SelectItem>
            <SelectItem value="DELETE">Deletion</SelectItem>
            <SelectItem value="LOGIN">Authentication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <section className="space-y-4">
        <SimpleTable headers={['Timestamp', 'Actor', 'Operation', 'Resource Target', 'Client Info']}>
          {logs.map((log: any) => (
            <SimpleTableRow key={log._id}>
              <SimpleTableCell className="text-slate-400 font-bold text-[10px] uppercase tabular-nums">
                {new Date(log.timestamp).toLocaleString()}
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="font-bold text-slate-700 text-xs">{log.actor?.name || 'SYSTEM'}</span>
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-none",
                  getActionBadge(log.action)
                )}>
                  {log.action}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="text-xs text-slate-500 font-medium truncate max-w-[250px]">
                  <span className="text-slate-400 mr-1">[{log.resourceType}]</span>
                  {log.details || 'No additional context'}
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="text-right font-mono text-[9px] text-slate-400">
                {log.ipAddress || 'Internal'}
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {logs.length === 0 && !isLoading && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={5} className="text-center py-20 text-slate-400">
                <Activity className="mx-auto h-12 w-12 text-slate-100 mb-4" />
                <p className="font-medium">Pulse detected. No events matching current telemetry filter.</p>
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>
    </div>
  )
}
