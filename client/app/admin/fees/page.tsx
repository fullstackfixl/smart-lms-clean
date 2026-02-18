"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DollarSign, Plus, AlertCircle } from "lucide-react"
import { feesApi, adminApi } from "@/lib/api"
import { toast } from "sonner"

export default function FeesManagementPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [pendingFees, setPendingFees] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loadingFees, setLoadingFees] = useState(true)
  const [isSetFeeDialogOpen, setIsSetFeeDialogOpen] = useState(false)
  const [newFee, setNewFee] = useState({
    student_id: "",
    amount: "",
    due_date: "",
    description: ""
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin') {
      fetchPendingFees()
      fetchStudents()
    }
  }, [token, user])

  const fetchPendingFees = async () => {
    if (!token) return
    
    setLoadingFees(true)
    try {
      const res = await feesApi.pending(token)
      if (res.success && res.data) {
        setPendingFees(Array.isArray(res.data) ? res.data : [])
      }
    } catch (error) {
      console.error('Failed to fetch fees:', error)
      toast.error('Failed to load fees')
    } finally {
      setLoadingFees(false)
    }
  }

  const fetchStudents = async () => {
    if (!token) return
    
    try {
      const res = await adminApi.listUsers(token, 'role=student')
      if (res.success && res.data) {
        setStudents((res.data as any).users || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleSetFee = async () => {
    if (!token) return
    
    if (!newFee.student_id || !newFee.amount || !newFee.due_date || !newFee.description) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const res = await feesApi.set(token, {
        student_id: newFee.student_id,
        amount: parseFloat(newFee.amount),
        due_date: newFee.due_date,
        description: newFee.description
      })
      if (res.success) {
        toast.success('Fee set successfully')
        setIsSetFeeDialogOpen(false)
        setNewFee({ student_id: "", amount: "", due_date: "", description: "" })
        fetchPendingFees()
      } else {
        toast.error(res.error || 'Failed to set fee')
      }
    } catch (error) {
      toast.error('Failed to set fee')
    }
  }

  const handleSendReminder = async (feeId: string, studentId: string) => {
    if (!token) return
    
    try {
      const res = await feesApi.reminder(token, { fee_id: feeId, student_id: studentId })
      if (res.success) {
        toast.success('Reminder sent successfully')
      } else {
        toast.error(res.error || 'Failed to send reminder')
      }
    } catch (error) {
      toast.error('Failed to send reminder')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  const totalPending = pendingFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fees Management</h1>
          <p className="text-muted-foreground">Track and manage student fees</p>
        </div>
        <Dialog open={isSetFeeDialogOpen} onOpenChange={setIsSetFeeDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Set Fee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set New Fee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student *</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={newFee.student_id}
                  onChange={(e) => setNewFee({ ...newFee, student_id: e.target.value })}
                >
                  <option value="">Select Student</option>
                  {students.map((s: any) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name || s.profile?.fullName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={newFee.amount}
                  onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={newFee.due_date}
                  onChange={(e) => setNewFee({ ...newFee, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Input
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  placeholder="Semester Fee, Lab Fee, etc."
                />
              </div>
              <Button onClick={handleSetFee} className="w-full">Set Fee</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Fees Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <DollarSign className="h-12 w-12 text-primary" />
            <div>
              <p className="text-3xl font-bold">${totalPending.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{pendingFees.length} pending payments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Fees</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFees ? (
            <div className="text-center py-8">Loading fees...</div>
          ) : pendingFees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending fees</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Student</th>
                    <th className="text-left p-4">Description</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Due Date</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFees.map((fee: any) => {
                    const dueDate = new Date(fee.due_date)
                    const isOverdue = dueDate < new Date()
                    
                    return (
                      <tr key={fee._id || fee.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          {fee.student_id?.name || fee.student_id?.profile?.fullName || 'N/A'}
                        </td>
                        <td className="p-4">{fee.description}</td>
                        <td className="p-4 font-semibold">${fee.amount}</td>
                        <td className="p-4">
                          {dueDate.toLocaleDateString()}
                          {isOverdue && (
                            <AlertCircle className="inline ml-2 h-4 w-4 text-red-500" />
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendReminder(fee._id || fee.id, fee.student_id?._id || fee.student_id?.id)}
                            >
                              Send Reminder
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
