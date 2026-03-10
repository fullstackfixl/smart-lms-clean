"use client"
 
import { useState, useEffect, useCallback, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload, 
  Video, 
  FileText, 
  File as FileIcon, 
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
  Sparkles,
  Layers,
  CheckCircle
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
    } catch { toast.error('Failed to load course list') } finally { setLoadingCourses(false) }
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
    } catch { toast.error('Failed to load course sections') } finally { setLoadingSections(false) }
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
    } catch { toast.error('Failed to load video lessons') } finally { setLoadingLessons(false) }
  }
 
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast.error('Invalid file. Check file size (Max 200MB) or format.')
      return
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setUploadSuccess(false)
      toast.success(`File selected: ${acceptedFiles[0].name.substring(0, 30)}...`)
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
      toast.error('Please select a course destination for your video.')
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
        toast.error('Security token invalid. Please refresh.')
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
        toast.success('Video uploaded successfully.')
        setTimeout(() => {
           setFile(null)
           setUploadProgress(0)
           setUploadSuccess(false)
        }, 5000)
      } else {
        toast.error(data.message || 'Upload interrupted.')
      }
    } catch {
      toast.error('Critical upload failure.')
    } finally {
      setUploading(false)
    }
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Media Upload Hero ────────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 p-12 lg:p-20 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05]">
              <Cloud className="w-80 h-80 -ml-20 -mb-20 rotate-12 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-10 max-w-2xl text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.25em] border border-white/20">
                <Video className="w-4 h-4" />
                Course Content Delivery
              </div>
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  Video <br />
                  <span className="text-indigo-400">Distribution.</span>
                </h1>
                <p className="text-[19px] font-bold text-slate-400 leading-relaxed max-w-xl opacity-90 italic">
                  Upload your high-definition video lessons to the platform. Our system handles processing, CDN distribution, and cross-device optimization automatically.
                </p>
              </div>
            </div>
 
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl group/card">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg">
                        <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Network Status: Optimized</span>
                   </div>
                   <p className="text-white/40 text-[13px] font-bold italic leading-relaxed">High-bandwidth upload channels are active. Secure connection established with the video processing network.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Upload Interface ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Destination Mapping */}
        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-12">
              <div className="space-y-3">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-70">// Destination Context</h3>
                 <p className="text-[28px] font-black text-slate-900 tracking-tight leading-none">Mapping Settings</p>
              </div>
 
              <div className="space-y-10">
                 <LogicSelect 
                    label="Target Course"
                    value={selectedCourse}
                    onValueChange={setSelectedCourse}
                    options={courses}
                    loading={loadingCourses}
                    placeholder="Select Course Bundle..."
                 />
                 {selectedCourse && (
                    <LogicSelect 
                      label="Curriculum Section"
                      value={selectedSection}
                      onValueChange={setSelectedSection}
                      options={sections}
                      loading={loadingSections}
                      placeholder="Select Module..."
                    />
                 )}
                 {selectedSection && (
                    <LogicSelect 
                      label="Specific Lesson Node"
                      value={selectedLesson}
                      onValueChange={setSelectedLesson}
                      options={lessons}
                      loading={loadingLessons}
                      placeholder="Identify Lesson Cell..."
                    />
                 )}
              </div>
           </div>
 
           <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 space-y-6 shadow-inner">
              <div className="flex items-center gap-4">
                 <Database className="w-5 h-5 text-indigo-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Technical Specs</span>
              </div>
              <ul className="space-y-4 text-[12px] font-bold text-slate-400 italic">
                 <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    Max File Payload: 200MB
                 </li>
                 <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    Extensions: MP4, MOV, MKV, AVI
                 </li>
                 <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    Adaptive Streaming Optimization
                 </li>
              </ul>
           </div>
        </div>
 
        {/* Upload Canvas */}
        <div className="lg:col-span-8">
           <div className="bg-white rounded-[4rem] border border-slate-100 p-8 lg:p-10 shadow-sm min-h-[650px] flex flex-col group/canvas transition-all hover:shadow-xl hover:shadow-slate-200/50">
              {!selectedLesson ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10 animate-in fade-in duration-1000">
                   <div className="relative">
                      <div className="absolute -inset-12 bg-slate-100 rounded-full blur-3xl opacity-50" />
                      <div className="relative w-28 h-28 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border-2 border-slate-100 shadow-sm transition-transform duration-700 hover:rotate-6">
                         <Terminal className="w-12 h-12 text-slate-200" strokeWidth={2.5} />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <p className="text-[18px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                        Awaiting Destination <br /> Parameters...
                      </p>
                      <p className="text-xs font-bold text-slate-300 italic opacity-60">Please map your content to a course lesson above.</p>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-10">
                   <div 
                      {...getRootProps()}
                      className={cn(
                        "flex-1 rounded-[3.5rem] border-4 border-dashed transition-all duration-700 flex flex-col items-center justify-center p-20 text-center relative group/drop overflow-hidden",
                        isDragActive ? "border-indigo-500 bg-indigo-50/30 scale-[0.98]" : "border-slate-100 bg-slate-50/20 hover:border-indigo-200 hover:bg-slate-50",
                        uploading ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                      )}
                    >
                      <input {...getInputProps()} />
                      
                      {uploadProgress > 0 && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${uploadProgress}%` }}
                          className="absolute bottom-0 left-0 w-full bg-indigo-500/5 transition-all duration-1000 ease-out z-0"
                        />
                      )}
 
                      {file ? (
                        <div className="space-y-10 relative z-10 animate-in zoom-in duration-700">
                           <div className="relative mx-auto w-40 h-40">
                              <div className="absolute -inset-12 bg-indigo-500/10 rounded-full blur-[80px] animate-pulse" />
                              <div className="relative h-40 w-40 rounded-[3.5rem] bg-slate-900 flex items-center justify-center shadow-2xl border-[8px] border-white transition-transform duration-700 group-hover/drop:rotate-3 group-hover/drop:scale-110">
                                 <Video className="w-16 h-16 text-indigo-500" strokeWidth={3} />
                              </div>
                           </div>
                           <div className="space-y-4">
                              <p className="text-3xl font-black text-slate-900 tracking-tight max-w-sm truncate mx-auto leading-none">{file.name}</p>
                              <div className="flex items-center justify-center gap-4">
                                <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">{(file.size / (1024*1024)).toFixed(2)} MB</span>
                                <span className="text-[12px] font-black text-indigo-500 uppercase tracking-widest animate-pulse italic">Ready for Upload</span>
                              </div>
                           </div>
                           {!uploading && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); setFile(null); }}
                               className="px-10 py-4 rounded-2xl bg-white border border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm"
                             >
                               Clear Selection
                             </button>
                           )}
                        </div>
                      ) : (
                        <div className="space-y-10 relative z-10">
                           <div className="w-28 h-28 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center mx-auto border border-slate-50 group-hover/drop:scale-125 group-hover/drop:-rotate-6 transition-all duration-1000">
                              <Upload className="w-12 h-12 text-slate-100 group-hover/drop:text-indigo-600 transition-colors" strokeWidth={3} />
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Upload Content Unit</h4>
                              <p className="text-[17px] font-bold text-slate-400 italic opacity-80 leading-relaxed max-w-sm mx-auto">
                                Click to select a file or drag your professional video lesson here to begin the synchronization process.
                              </p>
                           </div>
                        </div>
                      )}
                   </div>
 
                   <div className="p-10 space-y-12">
                      {uploading && (
                         <div className="space-y-6">
                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                               <div className="flex items-center gap-3">
                                 <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping" />
                                 <span className="text-indigo-600">Uploading Media Stream...</span>
                               </div>
                               <span className="text-slate-900 tabular-nums text-lg tracking-tighter">{uploadProgress}%</span>
                            </div>
                            <div className="h-5 w-full bg-slate-50 rounded-full overflow-hidden p-1.5 shadow-inner border border-slate-100">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${uploadProgress}%` }}
                                 className="h-full bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.6)]"
                               />
                            </div>
                         </div>
                      )}
 
                      <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={cn(
                          "w-full h-24 rounded-[3rem] text-[20px] font-black uppercase tracking-[0.25em] transition-all duration-700 flex items-center justify-center gap-8 shadow-2xl relative overflow-hidden group/btn",
                          !file || uploading 
                            ? "bg-slate-100 text-slate-300 pointer-events-none" 
                            : "bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-indigo-500/20"
                        )}
                      >
                         {uploading ? (
                           <Loader2 className="w-10 h-10 animate-spin text-indigo-400" strokeWidth={3} />
                         ) : (
                           <>
                              <Zap className="w-7 h-7 text-indigo-500 fill-indigo-500 group-hover/btn:scale-125 transition-transform" />
                              Begin Upload
                              <Sparkles className="w-7 h-7 text-indigo-500 group-hover/btn:rotate-12 transition-transform" />
                           </>
                         )}
                         <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover/btn:translate-y-[95%] transition-transform duration-700 opacity-20 pointer-events-none" />
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
    <div className="space-y-4">
       <div className="flex items-center justify-between px-3">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" strokeWidth={3} />}
       </div>
       <div className="relative group">
          <select 
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={loading}
            className="w-full h-16 bg-slate-50/50 border border-slate-100 rounded-2xl px-8 text-[14px] font-black appearance-none focus:ring-[12px] focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-200 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <option value="" className="font-bold text-slate-300">{placeholder}</option>
            {options.map((opt: any) => (
              <option key={opt._id} value={opt._id} className="font-bold text-slate-900">{opt.title}</option>
            ))}
          </select>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-hover:translate-y-[-40%]">
             <MousePointer2 className="w-4 h-4 text-indigo-500" strokeWidth={3} />
          </div>
       </div>
    </div>
  )
}
 
export default function InstructorUploadPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[75vh] gap-10">
          <div className="relative">
             <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
             <div className="h-24 w-24 border-[8px] border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-2xl" />
          </div>
          <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse italic text-center">Initializing Content Hub...</p>
       </div>
    }>
       <UploadContent />
    </Suspense>
  )
}
