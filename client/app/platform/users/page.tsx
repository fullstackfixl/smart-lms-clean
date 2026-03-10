"use client"

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  Shield, 
  GraduationCap, 
  UserCheck,
  Filter,
  ArrowUpRight,
  Lock,
  Unlock,
  Key
} from 'lucide-react'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { FlatMetricCard } from '../../../components/platform/flat-metric-card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from '../../../lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function UsersPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  
  const [activeTab, setActiveTab] = useState('student')
  const [search, setSearch] = useState('')
  
  const { data: response, error, isLoading, mutate } = useSWR(
    `/api/platform/users?role=${activeTab}&search=${search}${organizationId ? `&organization=${organizationId}` : ''}`, 
    fetcher
  )

  const users = response?.success ? response.data.users : []
  const stats = response?.success ? response.data.stats : { total: 0, active: 0, suspended: 0 }

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/platform/users/${id}/${action}`, {
        method: action === 'reset-password' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reset-password' ? JSON.stringify({ password: 'NewPassword123' }) : undefined
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`User ${action.replace('-', ' ')} successful`)
        mutate()
      } else {
        toast.error(data.message || "Action failed")
      }
    } catch (err) {
      toast.error("Network error")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            {organizationId ? 'Institutional Oversight' : 'Global User Monitoring'}
          </h1>
          <p className="mt-2 text-slate-500">
            {organizationId ? 'Aggregated identity data for child tenant.' : 'Monitor identity health and cross-institutional user growth.'}
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md px-6 shadow-none h-11">
          Suspend Selected
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FlatMetricCard
          title="Total Identities"
          value={stats?.total || 0}
          icon={Users}
          subtitle="Registered users"
        />
        <FlatMetricCard
          title="Active Learners"
          value={stats?.active || 0}
          icon={GraduationCap}
          className="border-l-4 border-l-green-500"
          subtitle="System access granted"
        />
        <FlatMetricCard
          title="Access Suspended"
          value={stats?.suspended || 0}
          icon={Lock}
          className="border-l-4 border-l-red-500"
          subtitle="Security restricted"
        />
      </div>

      {/* Tabs & Table */}
      <Tabs defaultValue="student" onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-white p-0.5 rounded-md border border-gray-200 w-fit">
          <TabsTrigger value="student" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold px-6 h-9 transition-all">
            Students
          </TabsTrigger>
          <TabsTrigger value="instructor" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold px-6 h-9 transition-all">
            Instructors
          </TabsTrigger>
          <TabsTrigger value="org_admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold px-6 h-9 transition-all">
            Org Admins
          </TabsTrigger>
        </TabsList>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-md border border-gray-200">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 stroke-[2]" />
              <input
                type="text"
                placeholder={`Search ${activeTab}s by name or email...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-0"
              />
            </div>
            <Button variant="ghost" className="text-slate-500 hover:text-blue-600 font-bold h-10 px-4">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>

          <SimpleTable headers={['Identity', 'Organization', 'Status', 'Joined At', 'Actions']}>
            {users.map((user: any) => (
              <SimpleTableRow key={user._id}>
                <SimpleTableCell>
                  <div>
                    <div className="font-bold text-blue-600 hover:underline cursor-pointer flex items-center">
                      {user.name}
                      {user.email_verified && <Badge className="ml-2 bg-blue-50 text-blue-500 border-none rounded-full px-1.5 py-0">✓</Badge>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                  </div>
                </SimpleTableCell>
                <SimpleTableCell>
                  <div className="text-slate-700 font-medium truncate max-w-[200px]">
                    {user.organization_id?.name || 'Platform Hub'}
                  </div>
                </SimpleTableCell>
                <SimpleTableCell>
                  <Badge className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    user.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {user.status}
                  </Badge>
                </SimpleTableCell>
                <SimpleTableCell className="text-slate-400 font-medium uppercase text-[10px]">
                  {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </SimpleTableCell>
                <SimpleTableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-blue-600">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-none p-1">
                      <DropdownMenuItem 
                        onClick={() => handleAction(user._id, user.status === 'active' ? 'suspend' : 'activate')}
                        className={cn(
                          "cursor-pointer font-medium py-2",
                          user.status === 'active' ? "text-orange-600 focus:bg-orange-50 focus:text-orange-700" : "text-green-600 focus:bg-green-50 focus:text-green-700"
                        )}
                      >
                        {user.status === 'active' ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                        {user.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleAction(user._id, 'reset-password')}
                        className="cursor-pointer text-slate-700 focus:bg-blue-50 focus:text-blue-600 py-2"
                      >
                        <Key className="mr-2 h-4 w-4" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-slate-700 focus:bg-blue-50 focus:text-blue-600 py-2">
                        <ArrowUpRight className="mr-2 h-4 w-4" /> View Full Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SimpleTableCell>
              </SimpleTableRow>
            ))}
            {users.length === 0 && !isLoading && (
              <SimpleTableRow>
                <SimpleTableCell colSpan={5} className="text-center py-12 text-slate-400">
                  No {activeTab}s identified.
                </SimpleTableCell>
              </SimpleTableRow>
            )}
          </SimpleTable>
        </section>
      </Tabs>
    </div>
  )
}
