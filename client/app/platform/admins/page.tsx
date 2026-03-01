"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { platformApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Search, UserPlus, Shield, ShieldOff, Mail, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Admin {
  _id: string
  name: string
  email: string
  isActive: boolean
  created_at: string
  email_verified: boolean
}

export default function AdminsPage() {
  const { token } = useAuth()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })

  useEffect(() => {
    if (token) {
      fetchAdmins()
    }
  }, [page, search, token])

  const fetchAdmins = async () => {
    if (!token) return
    
    setLoading(true)
    try {
      const response = await platformApi.listAdmins(token, {
        page,
        limit: 20,
        search: search || undefined
      })

      if (response.success && response.data) {
        const data = response.data as any
        setAdmins(data.admins || [])
        setTotalPages(data.pagination?.pages || 1)
      } else {
        toast.error(response.error || "Failed to fetch admins")
      }
    } catch (error) {
      console.error("Error fetching admins:", error)
      toast.error("Failed to fetch admins")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("All fields are required")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setCreating(true)
    try {
      if (!token) {
        toast.error("Authentication required")
        return
      }
      
      const response = await platformApi.createAdmin(token, formData)

      if (response.success) {
        toast.success("Platform admin created successfully")
        setIsCreateDialogOpen(false)
        setFormData({ name: "", email: "", password: "" })
        fetchAdmins()
      } else {
        toast.error(response.error || "Failed to create admin")
      }
    } catch (error) {
      console.error("Error creating admin:", error)
      toast.error("Failed to create admin")
    } finally {
      setCreating(false)
    }
  }

  const handleToggleStatus = async (admin: Admin) => {
    if (!token) return
    
    try {
      const response = await platformApi.updateAdminStatus(token, admin._id, !admin.isActive)

      if (response.success) {
        toast.success(`Admin ${!admin.isActive ? 'activated' : 'deactivated'} successfully`)
        fetchAdmins()
      } else {
        toast.error(response.error || "Failed to update admin status")
      }
    } catch (error) {
      console.error("Error updating admin status:", error)
      toast.error("Failed to update admin status")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
          Platform Admins
        </h1>
        <p className="text-slate-400">Manage platform administrators</p>
      </motion.div>

      {/* Search and Create */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200"
          />
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Create Platform Admin</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-300">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-700">
                  {creating ? "Creating..." : "Create Admin"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Admins List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {loading ? (
          <Card className="bg-slate-900/80 border-slate-800 p-12 text-center">
            <p className="text-slate-400">Loading admins...</p>
          </Card>
        ) : admins.length === 0 ? (
          <Card className="bg-slate-900/80 border-slate-800 p-12 text-center">
            <p className="text-slate-400">No platform admins found</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {admins.map((admin, index) => (
              <motion.div
                key={admin._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-100">{admin.name}</h3>
                          <Badge
                            variant={admin.isActive ? "default" : "secondary"}
                            className={admin.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"}
                          >
                            {admin.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {admin.email_verified && (
                            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{admin.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created {formatDate(admin.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={admin.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleStatus(admin)}
                          className={admin.isActive ? "" : "bg-emerald-600 hover:bg-emerald-700"}
                        >
                          {admin.isActive ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-2"
        >
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-slate-700 text-slate-300"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2 px-4">
            <span className="text-slate-400">
              Page {page} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-slate-700 text-slate-300"
          >
            Next
          </Button>
        </motion.div>
      )}
    </div>
  )
}
