"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  ShieldCheck, 
  AlertCircle 
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../../components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { platformApi } from '../../../lib/api'
import { toast } from "sonner"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    orgName: '',
    orgType: 'COLLEGE',
    adminName: '',
    adminEmail: ''
  })
  const [editOrg, setEditOrg] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await fetch(`/api/platform/organizations?search=${search}`)
        const data = await response.json()
        if (data.success) {
          setOrganizations(data.data.organizations)
          setTotal(data.data.total)
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchOrgs()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await platformApi.createOrgV2("", formData) // Token handled by credentials: include
      if (response.success) {
        toast.success("Institution invitation dispatched successfully")
        setIsModalOpen(false)
        setFormData({ orgName: '', orgType: 'COLLEGE', adminName: '', adminEmail: '' })
        // Refresh list
        setSearch(search) // Trigger refetch
      } else {
        toast.error(response.error || "Failed to dispatch invitation")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/platform/organizations/${editOrg._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editOrg.name,
          type: editOrg.type,
          plan: editOrg.plan
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Organization parameters updated successfully")
        setIsEditModalOpen(false)
        setOrganizations(prev => prev.map(o => o._id === editOrg._id ? { ...o, ...editOrg } : o))
      } else {
        toast.error(data.message || "Failed to update parameters")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            Organizations
          </h1>
          <p className="mt-2 text-slate-500">Manage institutional lifecycles and provisioning.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> Add New Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New Organization</DialogTitle>
              <DialogDescription>
                Send an automated invitation to a new institutional administrator.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddOrganization} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input 
                  id="orgName" 
                  placeholder="e.g. Stanford University" 
                  required 
                  value={formData.orgName}
                  onChange={(e) => setFormData({...formData, orgName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgType" className="text-slate-700 font-medium">Organization Type</Label>
                <Select 
                  value={formData.orgType} 
                  onValueChange={(val) => setFormData({...formData, orgType: val})}
                >
                  <SelectTrigger className="w-full bg-white text-slate-900 border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectItem value="COLLEGE" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">College / University</SelectItem>
                    <SelectItem value="SCHOOL" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">K-12 School</SelectItem>
                    <SelectItem value="COACHING" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Coaching Institute</SelectItem>
                    <SelectItem value="CORPORATE" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Corporate Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name</Label>
                <Input 
                  id="adminName" 
                  placeholder="e.g. John Doe" 
                  required 
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input 
                  id="adminEmail" 
                  type="email" 
                  placeholder="admin@institution.edu" 
                  required 
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Dispatching..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Organization Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white text-slate-900 border-none shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Edit Organization Parameters</DialogTitle>
              <DialogDescription className="text-slate-500">
                Update the institutional configuration for {editOrg?.name}.
              </DialogDescription>
            </DialogHeader>
            {editOrg && (
              <form onSubmit={handleUpdateOrganization} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editOrgName" className="text-slate-700 font-medium">Organization Name</Label>
                  <Input 
                    id="editOrgName" 
                    className="bg-gray-50 border-slate-200 text-slate-900 focus:bg-white"
                    value={editOrg.name}
                    onChange={(e) => setEditOrg({...editOrg, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editOrgType" className="text-slate-700 font-medium">Organization Type</Label>
                  <Select 
                    value={editOrg.type} 
                    onValueChange={(val) => setEditOrg({...editOrg, type: val})}
                  >
                    <SelectTrigger className="w-full bg-gray-50 text-slate-900 border-slate-200 focus:bg-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="COLLEGE" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">College / University</SelectItem>
                      <SelectItem value="SCHOOL" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">K-12 School</SelectItem>
                      <SelectItem value="COACHING" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Coaching Institute</SelectItem>
                      <SelectItem value="CORPORATE" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Corporate Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editOrgPlan" className="text-slate-700 font-medium">Subscription Plan</Label>
                  <Select 
                    value={editOrg.plan} 
                    onValueChange={(val) => setEditOrg({...editOrg, plan: val})}
                  >
                    <SelectTrigger className="w-full bg-gray-50 text-slate-900 border-slate-200 focus:bg-white">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      <SelectItem value="basic" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Basic</SelectItem>
                      <SelectItem value="premium" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Premium</SelectItem>
                      <SelectItem value="enterprise" className="text-slate-900 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 cursor-pointer">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full h-11 text-base font-bold shadow-none"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating Protocol..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SimpleCard className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Building2 className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Partners</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </SimpleCard>
        
        <SimpleCard className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-green-50 text-green-600">
            <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Nodes</p>
            <p className="text-2xl font-bold text-slate-900">
              {organizations.filter(o => o.status === 'active').length}
            </p>
          </div>
        </SimpleCard>

        <SimpleCard className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-50 text-orange-600">
            <AlertCircle className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Suspended</p>
            <p className="text-2xl font-bold text-slate-900">
              {organizations.filter(o => o.status === 'suspended').length}
            </p>
          </div>
        </SimpleCard>
      </div>

      {/* Registry Table */}
      <SimpleCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
            <input
              type="text"
              placeholder="Filter by name, subdomain, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="text-slate-600 border-gray-200">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>
        </div>

        <FlatTable>
          <FlatTableHead>
            <FlatTableRow>
              <FlatTableCell className="font-semibold text-slate-700">Institution Name</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Subdomain</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Type</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Plan</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Status</FlatTableCell>
              <FlatTableCell className="font-semibold text-slate-700">Created At</FlatTableCell>
              <FlatTableCell className="text-right"></FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <FlatTableRow key={i}>
                  <FlatTableCell colSpan={7}>
                    <div className="h-8 w-full animate-pulse rounded bg-gray-50" />
                  </FlatTableCell>
                </FlatTableRow>
              ))
            ) : organizations.length === 0 ? (
              <FlatTableRow>
                <FlatTableCell colSpan={7} className="h-48 text-center text-slate-500">
                  No organizations identified in the registry.
                </FlatTableCell>
              </FlatTableRow>
            ) : (
              organizations.map((org) => (
                <FlatTableRow key={org._id}>
                  <FlatTableCell className="font-medium text-blue-600">
                    <Link href={`/platform/users?organizationId=${org._id}`} className="hover:underline text-left">
                      {org.name}
                    </Link>
                  </FlatTableCell>
                  <FlatTableCell className="text-slate-600">{org.subdomain}.instatute.com</FlatTableCell>
                  <FlatTableCell>
                    <SimpleBadge variant="gray">{org.type}</SimpleBadge>
                  </FlatTableCell>
                  <FlatTableCell>
                    <SimpleBadge variant="orange" className="uppercase">{org.plan}</SimpleBadge>
                  </FlatTableCell>
                  <FlatTableCell>
                    <SimpleBadge variant={org.status === 'active' ? 'green' : 'red'}>
                      {org.status}
                    </SimpleBadge>
                  </FlatTableCell>
                  <FlatTableCell className="text-slate-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </FlatTableCell>
                  <FlatTableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 shadow-none border-gray-200 bg-white">
                        <DropdownMenuItem 
                          className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setEditOrg(org);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit Parameters
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/platform/courses?organizationId=${org._id}`} className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50 flex items-center px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            View Courses
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50">View Subscriptions</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50">Security Audit</DropdownMenuItem>
                        <DropdownMenuItem 
                          className={`cursor-pointer font-bold ${org.status === 'active' ? 'text-orange-600' : 'text-green-600'}`}
                          onClick={async () => {
                            try {
                              const endpoint = org.status === 'active' ? 'suspend' : 'activate';
                              const res = await fetch(`/api/platform/organizations/${org._id}/${endpoint}`, { 
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' }
                              });
                              const resData = await res.json();
                              if (resData.success) {
                                toast.success(`Institution ${endpoint === 'suspend' ? 'suspended' : 'activated'} successfully`);
                                setOrganizations(prev => prev.map(o => o._id === org._id ? { ...o, status: endpoint === 'suspend' ? 'suspended' : 'active' } : o));
                              } else {
                                toast.error(resData.message || "Action failed");
                              }
                            } catch (err) {
                              console.error('Action protocol failed:', err);
                              toast.error("Network error during action dispatch");
                            }
                          }}
                        >
                          {org.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
