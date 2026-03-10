"use client"

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  UserCheck, 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Mail, 
  Globe 
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

export default function InstructorsPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')

  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true)
      try {
        let url = `/api/platform/users?role=instructor&search=${search}`
        if (organizationId) url += `&organization=${organizationId}`
        
        const response = await fetch(url)
        const data = await response.json()
        if (data.success) {
          setInstructors(data.data.users)
        }
      } catch (error) {
        console.error('Failed to fetch instructors:', error)
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(() => {
      fetchInstructors()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, organizationId])

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            {organizationId ? 'Institutional Faculty' : 'Global Instructors'}
          </h1>
          <p className="mt-2 text-slate-500">
            {organizationId ? 'Overseeing specialized faculty node for child tenant.' : 'Universal faculty registry across all institutional nodes.'}
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-none">
          <UserPlus className="mr-2 h-4 w-4" /> Provision Faculty
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <SimpleCard className="flex flex-col justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <UserCheck className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Faculty</p>
            <p className="text-2xl font-bold text-slate-900">{instructors.length}</p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex flex-col justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600">
            <Globe className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Nodes</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex flex-col justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-600">
            <Mail className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Verified</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex flex-col justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <Filter className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending</p>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
        </SimpleCard>
      </div>

      {/* Faculty Registry Table */}
      <SimpleCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
            <input
              type="text"
              placeholder="Identify faculty profile..."
              className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <FlatTable>
          <FlatTableHead>
            <FlatTableRow>
              <FlatTableCell className="font-semibold text-slate-700">Full Name</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Email Address</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Home Institution</FlatTableCell>
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
            ) : instructors.length === 0 ? (
              <FlatTableRow>
                <FlatTableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">No records identified</h4>
                      <p className="text-sm text-slate-500">The global faculty registry is currently empty.</p>
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white mt-4 shadow-none">
                      Provision Faculty
                    </Button>
                  </div>
                </FlatTableCell>
              </FlatTableRow>
            ) : (
              instructors.map((instructor) => (
                <FlatTableRow key={instructor._id}>
                  <FlatTableCell className="font-medium text-blue-600 hover:underline cursor-pointer">
                    {instructor.name}
                  </FlatTableCell>
                  <FlatTableCell className="text-slate-600 font-mono text-xs">{instructor.email}</FlatTableCell>
                  <FlatTableCell className="text-slate-500">
                    {instructor.organization_id?.name || 'Independent Vendor'}
                  </FlatTableCell>
                  <FlatTableCell>
                    <SimpleBadge variant={instructor.status === 'active' ? 'green' : 'orange'}>
                      {instructor.status}
                    </SimpleBadge>
                  </FlatTableCell>
                  <FlatTableCell className="text-slate-500">
                    {new Date(instructor.created_at).toLocaleDateString()}
                  </FlatTableCell>
                  <FlatTableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </FlatTableCell>
                </FlatTableRow>
              ))
            )}
          </tbody>
        </FlatTable>
      </SimpleCard>
    </div>
  )
}
