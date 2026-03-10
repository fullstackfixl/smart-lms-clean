"use client"

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  Shield, 
  GraduationCap, 
  UserCheck 
} from 'lucide-react'
import { 
  SimpleCard, 
  SimpleBadge, 
  FlatTable, 
  FlatTableHead, 
  FlatTableRow, 
  FlatTableCell 
} from '../../../components/platform/ui-standard'
import { Button } from '../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"

export default function UsersPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('student')

  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        let url = `/api/platform/users?role=${activeTab}&search=${search}`
        if (organizationId) url += `&organization=${organizationId}`
        
        const response = await fetch(url)
        const data = await response.json()
        if (data.success) {
          setUsers(data.data.users)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [activeTab, search, organizationId])

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            {organizationId ? 'Institutional Oversight' : 'Users & Roles'}
          </h1>
          <p className="mt-2 text-slate-500">
            {organizationId ? 'Filtering identity data for child tenant node.' : 'Manage global identity and hierarchical access control.'}
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-none">
          <UserPlus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </div>

      <Tabs defaultValue="student" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-md border border-gray-200">
          <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-6">
            <GraduationCap className="mr-2 h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="instructor" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-6">
            <UserCheck className="mr-2 h-4 w-4" /> Instructors
          </TabsTrigger>
          <TabsTrigger value="org_admin" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-6">
            <Shield className="mr-2 h-4 w-4" /> Org Admins
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 flex items-center justify-between rounded-t-md bg-white p-4 border border-gray-200 border-b-0">
          <div className="relative w-full max-sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
            <input
              type="text"
              placeholder={`Search ${activeTab}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-slate-600">Bulk Assign Role</Button>
          </div>
        </div>

        <SimpleCard className="p-0 overflow-hidden border-t-0 rounded-t-none">
          <FlatTable>
            <FlatTableHead>
              <FlatTableRow>
                <FlatTableCell className="font-semibold text-slate-700">Name</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Email Address</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Organization</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Status</FlatTableCell>
                <FlatTableCell className="font-semibold text-slate-700">Joined</FlatTableCell>
                <FlatTableCell className="text-right"></FlatTableCell>
              </FlatTableRow>
            </FlatTableHead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <FlatTableRow key={i}>
                    <FlatTableCell colSpan={6} className="h-16">
                      <div className="h-8 w-full animate-pulse rounded bg-gray-50" />
                    </FlatTableCell>
                  </FlatTableRow>
                ))
              ) : users.length === 0 ? (
                <FlatTableRow>
                  <FlatTableCell colSpan={6} className="h-48 text-center text-slate-500">
                    No users identified for role: {activeTab}
                  </FlatTableCell>
                </FlatTableRow>
              ) : (
                users.map((user) => (
                  <FlatTableRow key={user._id}>
                    <FlatTableCell className="font-medium text-blue-600 hover:underline cursor-pointer">
                      {user.name}
                    </FlatTableCell>
                    <FlatTableCell className="text-slate-600 text-xs font-mono">{user.email}</FlatTableCell>
                    <FlatTableCell className="text-slate-500 text-sm">
                      {user.organization_id?.name || 'Platform Level'}
                    </FlatTableCell>
                    <FlatTableCell>
                      <SimpleBadge variant={user.status === 'active' ? 'green' : 'orange'}>
                        {user.status}
                      </SimpleBadge>
                    </FlatTableCell>
                    <FlatTableCell className="text-slate-500 text-sm">
                      {new Date(user.created_at || Date.now()).toLocaleDateString()}
                    </FlatTableCell>
                    <FlatTableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </FlatTableCell>
                  </FlatTableRow>
                ))
              )}
            </tbody>
          </FlatTable>
        </SimpleCard>
      </Tabs>
    </div>
  )
}
