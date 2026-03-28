"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Loader2,
  AlertCircle,
  GraduationCap,
  Building2,
  CalendarDays,
  User,
  Mail,
  Lock,
  Hash
} from "lucide-react"

import { useAuth } from "../../../../lib/auth-context"
import { collegeApi, adminApi } from "../../../../lib/api"
import { Button } from "../../../../components/ui/button"
import { toast } from "sonner"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../../components/ui/select"

export default function NewLearnerPage() {
  const { token } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Password123", // Default password for manual creation
    rollNumber: "",
    departmentId: "",
    programId: "",
    batchId: "",
    semester: "1",
    phoneNumber: "",
    gender: ""
  })

  // Dropdown Data
  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])

  useEffect(() => {
    if (token) {
      loadInitialData()
    }
  }, [token])

  async function loadInitialData() {
    setFetchingData(true)
    try {
      const [deptRes, progRes, batchRes] = await Promise.all([
        collegeApi.listDepartments(token!),
        collegeApi.listPrograms(token!),
        collegeApi.listBatches(token!)
      ])

      if (deptRes.success) {
        const d = deptRes.data as any
        setDepartments(d?.departments ?? d?.data ?? d ?? [])
      }
      if (progRes.success) {
        const d = progRes.data as any
        setPrograms(d?.programs ?? d?.data ?? d ?? [])
      }
      if (batchRes.success) {
        const d = batchRes.data as any
        setBatches(d?.batches ?? d?.data ?? d ?? [])
      }
    } catch (err) {
      console.error("Error loading form data:", err)
      toast.error("Failed to load academic data")
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.email || !formData.firstName || !formData.programId || !formData.batchId) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // 1. Create the User with role 'student'
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        role: "student",
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          rollNumber: formData.rollNumber,
          departmentId: formData.departmentId,
          programId: formData.programId,
          batchId: formData.batchId,
          current_semester: parseInt(formData.semester),
          gender: formData.gender,
          phone: formData.phoneNumber
        }
      }

      const response = await adminApi.createUser(token!, payload)
      
      if (response.success) {
        const newUser = (response.data as any) || (response as any).user
        
        // 2. Assign to Program/Batch (Double ensuring sync for college modules)
        if (newUser && newUser._id) {
          await collegeApi.assignLearnerToProgramBatch(token!, {
            studentId: newUser._id,
            programId: formData.programId,
            batchId: formData.batchId
          })
        }

        toast.success("Student created successfully")
        router.push("/org-admin/learners")
      } else {
        toast.error(response.error || "Failed to create student")
      }
    } catch (err: any) {
      console.error("Error creating student:", err)
      toast.error(err.message || "Failed to create student")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 animate-pulse">Preparing registration form...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add New Learner</h1>
            <p className="text-slate-500">Register a new student and assign them to academic tracks.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-slate-800">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="firstName"
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, firstName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="email"
                    type="email"
                    className="pl-10"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="password"
                    type="text"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-slate-400">Student can change this after first login.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(v: string) => setFormData({...formData, gender: v})}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Security Note</p>
              <p className="opacity-90">An invitation email will be sent to the learner once the account is created. They will be required to verify their email before they can access the platform.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Academic Info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <GraduationCap className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-slate-800">Academic Placement</h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number / Student ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="rollNumber"
                    className="pl-10"
                    placeholder="e.g. STU-2024-001"
                    value={formData.rollNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, rollNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formData.departmentId} onValueChange={(v: string) => setFormData({...formData, departmentId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Program / Degree <span className="text-red-500">*</span></Label>
                <Select value={formData.programId} onValueChange={(v: string) => setFormData({...formData, programId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map(p => (
                      <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Academic Batch <span className="text-red-500">*</span></Label>
                <Select value={formData.batchId} onValueChange={(v: string) => setFormData({...formData, batchId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map(b => (
                      <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Current Semester</Label>
                <Select value={formData.semester} onValueChange={(v: string) => setFormData({...formData, semester: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-md shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Create Student Account
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
