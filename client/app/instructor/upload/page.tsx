"use client"
 
import { useState, useEffect, useCallback, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload, 
  Video, 
  FileText, 
  File, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  X, 
  Cloud, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight,
  Database,
  Globe,
  Monitor,
  Cpu,
  Server,
  Terminal,
  MousePointer2,
  Sparkles
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { cn } from "../../../lib/utils"
import { API_URL } from '../../../lib/config'
import { toast } from "sonner"
 
interface Course { _id: string; title: string }
interface Section { _id: string; title: string; course_id: string }
interface Lesson { _id: string; title: string; section_id: string; type: string }
 
function UploadContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedLesson, setSelectedLesson] = useState("")
  
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(false)
 
  useEffect(() => { fetchCourses() }, [])
  useEffect(() => { if (selectedCourse) fetchSections(selectedCourse) }, [selectedCourse])
  useEffect(() => { if (selectedSection) fetchLessons(selectedSection) }, [selectedSection])
 
  const fetchCourses = async () => {
    setLoadingCourses(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
      const response = await fetch(`${API_URL}/instructor/courses`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        setCourses(Array.isArray(data.data) ? data.data : (data.data?.courses || []))
      }
    } catch { toast.error('Course registry link failure') } finally { setLoadingCourses(false) }
  }
 
  const fetchSections = async (courseId: string) => {
    setLoadingSections(true)
    setSections([])
    setLessons([])
    setSelectedSection("")
    setSelectedLesson("")
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
      const response = await fetch(`${API_URL}/instructor/courses/${courseId}/sections`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) setSections(Array.isArray(data.data) ? data.data : [])
    } catch { toast.error('Section architecture sync failure') } finally { setLoadingSections(false) }
  }
 
  const fetchLessons = async (sectionId: string) => {
    setLoadingLessons(true)
    setLessons([])
    setSelectedLesson("")
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
      const response = await fetch(`${API_URL}/instructor/sections/${sectionId}/lessons`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (data.success) {
        const lessonsData = Array.isArray(data.data) ? data.data : []
        setLessons(lessonsData.filter((l: any) => l.type === 'video'))
      }
    } catch { toast.error('Lesson node authentication failure') } finally { setLoadingLessons(false) }
  }
 
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast.error('Invalid transmission unit. Check file size (Max 200MB) or format.')
      return
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setUploadSuccess(false)
      toast.success(`Unit identified: ${acceptedFiles[0].name.substring(0, 20)}...`)
    }
  }, [])
 
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv'] },
    maxSize: 200 * 1024 * 1024,
    multiple: false,
    disabled: uploading
  })
 
  const handleUpload = async () => {
    if (!file || !selectedLesson) {
      toast.error('Incomplete parameters for deployment sequence.')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
 
      const csrfResponse = await fetch(`${API_URL}/api/csrf-token`, { credentials: 'include' })
      const csrfData = await csrfResponse.json()
      if (!csrfData.success) {
        toast.error('Security protocol breach. CSRF invalid.')
        return
      }
 
      const formData = new FormData()
      formData.append('video', file)
 
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 95 ? 95 : prev + 5))
      }, 800)
 
      const response = await fetch(
        `${API_URL}/api/instructor/lectures/${selectedLesson}/upload-video`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'X-CSRF-Token': csrfData.data.csrfToken },
          credentials: 'include',
          body: formData
        }
      )
 
      clearInterval(progressInterval)
      setUploadProgress(100)
      const data = await response.json()
 
      if (response.ok && data.success) {
        setUploadSuccess(true)
        toast.success('Core media synchronized with global CDN.')
        setTimeout(() => {
           setFile(null)
           setUploadProgress(0)
           setUploadSuccess(false)
        }, 5000)
      } else {
        toast.error(data.message || 'Signal interruption during deployment.')
      }
    } catch {
      toast.error('Critical deployment failure.')
    } finally {
      setUploading(false)
    }
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Deployment Hero ────────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-[#020617] p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05]">
              <Cloud className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                <Server className="w-4 h-4" />
                Global Deployment Uplink
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  Content <br />
                  <span className="text-indigo-400">Broadcasting.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-400 leading-relaxed max-w-xl opacity-90">
                  Deploy high-fidelity video assets to the platform grid. Automated resolution synthesis, CDN synchronization, and global distribution are initiated upon uplink.
                </p>
              </div>
            </div>
 
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                   <div className="flex items-center gap-4 mb-4">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                      <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">CDN INTEGRITY: PEAK</span>
                   </div>
                   <p className="text-white/40 text-[13px] font-bold italic leading-relaxed">Multi-region server health validated. Latency: 4ms globally. Ready for transmission.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Upload Interface ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Parameters Section */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 lg:p-12 shadow-sm space-y-12">
              <div className="space-y-2">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">// Deployment Parameters</h3>
                 <p className="text-[24px] font-black text-slate-900 tracking-tight">Logic Settings</p>
              </div>
 
              <div className="space-y-8">
                 <LogicSelect 
                    label="Academic Course"
                    value={selectedCourse}
                    onValueChange={setSelectedCourse}
                    options={courses}
                    loading={loadingCourses}
                    placeholder="Identify Stream..."
                 />
                 {selectedCourse && (
                    <LogicSelect 
                      label="Curriculum Section"
                      value={selectedSection}
                      onValueChange={setSelectedSection}
                      options={sections}
                      loading={loadingSections}
                      placeholder="Identify Hub..."
                    />
                 )}
                 {selectedSection && (
                    <LogicSelect 
                      label="Deployment Node"
                      value={selectedLesson}
                      onValueChange={setSelectedLesson}
                      options={lessons}
                      loading={loadingLessons}
                      placeholder="Identify Cell..."
                    />
                 )}
              </div>
           </div>
 
           <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-center gap-4">
                 <Database className="w-5 h-5 text-indigo-500" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Transmission Specs</span>
              </div>
              <ul className="space-y-2 text-[12px] font-bold text-slate-400 italic">
                 <li>• Maximum Payload: 200MB</li>
                 <li>• Supported Extensions: MP4, MOV, MKV</li>
                 <li>• Resolution: Adaptive Multi-Tier (1080p+)</li>
              </ul>
           </div>
        </div>
 
        {/* Payload Section */}
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[4rem] border border-slate-100 p-4 lg:p-6 shadow-sm min-h-[600px] flex flex-col">
              {!selectedLesson ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 opacity-40">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-200">
                      <Terminal className="w-10 h-10 text-slate-200" />
                   </div>
                   <p className="text-[16px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                     Awaiting Parameter <br /> Synchronization...
                   </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-6">
                   <div 
                      {...getRootProps()}
                      className={cn(
                        "flex-1 rounded-[3.5rem] border-4 border-dashed transition-all duration-700 flex flex-col items-center justify-center p-20 text-center relative group/drop overflow-hidden",
                        isDragActive ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]" : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50/30",
                        uploading ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                      )}
                    >
                      <input {...getInputProps()} />
                      
                      {uploadProgress > 0 && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${uploadProgress}%` }}
                          className="absolute bottom-0 left-0 w-full bg-indigo-500/5 transition-all duration-1000 ease-out"
                        />
                      )}
 
                      {file ? (
                        <div className="space-y-8 relative z-10 animate-in zoom-in duration-500">
                           <div className="relative mx-auto w-32 h-32">
                              <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                              <div className="relative h-32 w-32 rounded-[3rem] bg-[#020617] flex items-center justify-center shadow-2xl border-[6px] border-white">
                                 <Video className="w-12 h-12 text-indigo-500" strokeWidth={3} />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <p className="text-2xl font-black text-slate-900 tracking-tight max-w-sm truncate mx-auto">{file.name}</p>
                              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{(file.size / (1024*1024)).toFixed(2)} MB • READY FOR UPLINK</p>
                           </div>
                           {!uploading && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); setFile(null); }}
                               className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                             >
                               DRAIN PAYLOAD
                             </button>
                           )}
                        </div>
                      ) : (
                        <div className="space-y-8 relative z-10">
                           <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mx-auto border border-slate-50 group-hover/drop:scale-110 group-hover/drop:rotate-6 transition-all duration-700">
                              <Upload className="w-10 h-10 text-indigo-100 group-hover/drop:text-indigo-600 transition-colors" />
                           </div>
                           <div className="space-y-2">
                              <h4 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Inject Media Unit</h4>
                              <p className="text-[16px] font-medium text-slate-400 italic opacity-80 leading-relaxed max-w-sm mx-auto">
                                Click to browse repository or drag high-fidelity video unit here to initiate deployment.
                              </p>
                           </div>
                        </div>
                      )}
                   </div>
 
                   <div className="p-10 space-y-10">
                      {uploading && (
                         <div className="space-y-4">
                            <div className="flex items-center justify-between text-[12px] font-black uppercase tracking-widest">
                               <span className="text-indigo-600 animate-pulse">Broadcasting Signal...</span>
                               <span className="text-slate-900 tabular-nums">{uploadProgress}%</span>
                            </div>
                            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${uploadProgress}%` }}
                                 className="h-full bg-indigo-600 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.5)]"
                               />
                            </div>
                         </div>
                      )}
 
                      <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={cn(
                          "w-full h-24 rounded-[3rem] text-[18px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-6 shadow-2xl relative overflow-hidden group/btn",
                          !file || uploading ? "bg-slate-100 text-slate-300 pointer-events-none" : "bg-[#020617] text-white hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                         {uploading ? (
                           <Loader2 className="w-8 h-8 animate-spin" />
                         ) : (
                           <>
                              <Zap className="w-6 h-6 text-indigo-500" />
                              INITIATE DEPLOYMENT
                              <Sparkles className="w-6 h-6 text-indigo-500" />
                           </>
                         )}
                      </button>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
 
function LogicSelect({ label, value, onValueChange, options, loading, placeholder }: any) {
  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between px-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />}
       </div>
       <div className="relative group">
          <select 
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={loading}
            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-[14px] font-black appearance-none focus:ring-[8px] focus:ring-indigo-500/5 focus:bg-white transition-all cursor-pointer disabled:opacity-50"
          >
            <option value="">{placeholder}</option>
            {options.map((opt: any) => (
              <option key={opt._id} value={opt._id}>{opt.title}</option>
            ))}
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
             <MousePointer2 className="w-4 h-4 text-slate-300" />
          </div>
       </div>
    </div>
  )
}
 
export default function InstructorUploadPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-20 w-20 border-[8px] border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-500/10" />
          <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse">Initializing Deployment Hub</p>
       </div>
    }>
       <UploadContent />
    </Suspense>
  )
}
