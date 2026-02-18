"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus, Search, Edit, Trash2, UserCheck, UserX } from "lucide-react"
import { adminApi } from "@/lib/api"
import { toast } from "sonner"

export default function UserManagementPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "student",
    phone: ""
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin') {
      fetchUsers()
    }
  }, [token, user, roleFilter, statusFilter, searchQuery])

  const fetchUsers = async () => {
    if (!token) return
    
    setLoadingUsers(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await adminApi.listUsers(token, params.toString())
      if (res.success && res.data) {
        setUsers((res.data as any).users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleCreateUser = async () => {
    if (!token) return
    
    if (!newUser.email || !newUser.password || !newUser.fullName || !newUser.role) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await adminApi.createUser(token, newUser)
      if (res.success) {
        toast.success('User created successfully')
        setIsCreateDialogOpen(false)
        setNewUser({ email: "", password: "", fullName: "", role: "student", phone: "" })
        fetchUsers()
      } else {
        toast.error(res.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Failed to create user')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!token) return
    
    try {
      const res = await adminApi.updateUserStatus(token, userId, !currentStatus)
      if (res.success) {
        toast.success(`User ${!currentStatus ? 'enabled' : 'disabled'} successfully`)
        fetchUsers()
      } else {
        toast.error(res.error || 'Failed to update user status')
      }
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const res = await adminApi.deleteUser(token, userId)
      if (res.success) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error(res.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage students, instructors, and parents</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <Label>Role *</Label>
                <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>
              <Button onClick={handleCreateUser} className="w-full">Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id || u._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{u.name || u.profile?.fullName || 'N/A'}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Inactive</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(u.id || u._id, u.isActive)}
                          >
                            {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUser(u.id || u._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
