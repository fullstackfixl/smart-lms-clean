"use client"
 
import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, Check, CheckCheck, Trash2, Filter, AlertCircle,
  Info, CheckCircle2, XCircle, Clock, 
  Search, ShieldCheck, Zap, Sparkles, Database,
  Activity, ArrowUpRight, MousePointer2, Target, Globe
} from "lucide-react"
import { Badge } from '../../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { toast } from "sonner"
import { cn } from '../../../lib/utils'
import { API_URL } from '../../../lib/config'
 
interface Notification {
  _id: string
  type: string
  title: string
  message: string
  status: 'pending' | 'sent' | 'read' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sender_id?: {
    name: string
    email: string
  }
  created_at: string
  metadata?: any
}
 
function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [unreadCount, setUnreadCount] = useState(0)
 
  useEffect(() => {
    loadNotifications()
  }, [statusFilter])
 
  async function loadNotifications() {
    setLoading(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
 
      const params = new URLSearchParams({ limit: '50' })
      if (statusFilter !== 'all') params.append('status', statusFilter)
 
      const response = await fetch(`${API_URL}/instructor/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
 
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setNotifications(data.data.notifications || [])
          setUnreadCount(data.data.unreadCount || 0)
        }
      }
    } catch (error) {
      toast.error("Intelligence stream sync failure")
    } finally {
      setLoading(false)
    }
  }
 
  async function markAsRead(notificationId: string) {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
      const response = await fetch(`${API_URL}/instructor/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        toast.success("Signal acknowledged")
        loadNotifications()
      }
    } catch {
      toast.error("Protocol failure")
    }
  }
 
  async function markAllAsRead() {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
      const response = await fetch(`${API_URL}/instructor/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        toast.success("All signals acknowledged")
        loadNotifications()
      }
    } catch {
      toast.error("Batch protocol failure")
    }
  }
 
  async function deleteNotification(notificationId: string) {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return
      const response = await fetch(`${API_URL}/instructor/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        toast.success("Data unit purged")
        loadNotifications()
      }
    } catch {
      toast.error("Purge failure")
    }
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Telemetry Streams Hero ─────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] transition-all">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-amber-50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Bell className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-amber-50 text-amber-700 text-[11px] font-black uppercase tracking-[0.25em] border border-amber-100/50">
                <Activity className="w-4 h-4" />
                Live Telemetry Streams
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Operational <br />
                  <span className="text-amber-600">Signals.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Stay synchronized with platform-wide intelligence. Real-time alerts on scholar milestones, curriculum pulse, and fiscal events delivered through high-fidelity telemetry.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="h-20 px-12 bg-[#020617] text-white rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl group"
                  >
                    <CheckCheck className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    ACKNOWLEDGE ALL
                  </button>
                )}
                <div className="flex items-center gap-4 h-20 px-8 rounded-[2.2rem] border border-slate-100 bg-slate-50 shadow-inner">
                   <div className={cn("h-3 w-3 rounded-full animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]", unreadCount > 0 ? "bg-amber-500" : "bg-emerald-500")} />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                     {unreadCount > 0 ? `${unreadCount} UNREAD SIGNALS` : "ALL SIGNALS CLEAR"}
                   </span>
                </div>
              </div>
            </div>
 
            {/* Macro Stats */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all hover:border-amber-200">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URGENT PRIORITY</p>
                   <p className="text-[40px] font-black tracking-tighter tabular-nums text-slate-900 leading-none">
                     {notifications.filter(n => n.priority === 'urgent' && (n.status === 'pending' || n.status === 'sent')).length}
                   </p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all hover:border-blue-200">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SYSTEM ALERTS</p>
                   <p className="text-[40px] font-black tracking-tighter tabular-nums text-slate-900 leading-none">
                     {notifications.filter(n => n.type === 'warning' || n.type === 'error').length}
                   </p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Control Surface ────────────────────────────────────────── */}
      <div className="flex items-center gap-8 px-4">
        <div className="bg-slate-50 p-1 rounded-[2.2rem] border border-slate-100 shadow-inner w-full lg:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-20 w-full lg:w-[260px] rounded-[2rem] bg-white border-none shadow-sm px-8 font-black text-[14px]">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-amber-500" strokeWidth={3} />
                <SelectValue placeholder="All Contexts" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-[2.2rem] p-3 border-slate-100 shadow-2xl">
              <SelectItem value="all" className="rounded-xl py-4 font-black">ALL SIGNALS</SelectItem>
              <SelectItem value="pending" className="rounded-xl py-4 font-black">UNACKNOWLEDGED</SelectItem>
              <SelectItem value="read" className="rounded-xl py-4 font-black">ARCHIVED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-20 px-8 rounded-[2rem] border border-slate-100 bg-white/50 backdrop-blur-md flex items-center gap-4 ml-auto">
           <Database className="w-5 h-5 text-slate-300" />
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Establishing secure link...</p>
        </div>
      </div>
 
      {/* ─── Notification Matrix ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 p-4">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="h-40 rounded-[3rem] bg-slate-50 animate-pulse" />
             ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-dashed border-slate-200 rounded-[4rem] py-48 text-center m-4"
          >
             <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100 mx-auto">
                <Sparkles className="h-10 w-10 text-slate-200" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">SIGNALS CLEAR</h3>
             <p className="text-[17px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed italic opacity-80">
               {statusFilter !== 'all' ? 'The current sector is devoid of data units.' : 'Strategic communication streams are currently stagnant.'}
             </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-8 p-4">
             {notifications.map((notif, idx) => (
               <NotificationCard
                 key={notif._id}
                 notif={notif}
                 idx={idx}
                 onRead={() => markAsRead(notif._id)}
                 onDelete={() => deleteNotification(notif._id)}
               />
             ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
 
function NotificationCard({ notif, idx, onRead, onDelete }: any) {
  const isUnread = notif.status === 'pending' || notif.status === 'sent'
 
  const icons: any = {
    success: <CheckCircle2 className="h-7 w-7 text-emerald-500" />,
    error: <XCircle className="h-7 w-7 text-rose-500" />,
    warning: <AlertCircle className="h-7 w-7 text-amber-500" />,
    info: <Info className="h-7 w-7 text-blue-500" />,
  }
 
  const priorities: any = {
    urgent: "bg-rose-500 text-white shadow-lg shadow-rose-500/20",
    high: "bg-amber-100 text-amber-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-slate-100 text-slate-500",
  }
 
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className={cn(
        "group relative bg-white border rounded-[3.5rem] p-10 lg:p-14 transition-all duration-700 overflow-hidden",
        isUnread 
          ? "border-amber-500/30 shadow-[0_48px_96px_-24px_rgba(245,158,11,0.08)] bg-amber-50/5" 
          : "border-slate-100 shadow-sm hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]"
      )}
    >
      <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
         {icons[notif.type] || icons.info}
      </div>
 
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
         
         <div className="flex items-start gap-8 flex-1 min-w-0">
            <div className={cn(
              "h-20 w-20 rounded-[2.2rem] flex items-center justify-center shrink-0 border-2 transition-transform duration-700 group-hover:rotate-6 shadow-sm",
              isUnread ? "bg-white border-amber-200" : "bg-slate-50 border-slate-100"
            )}>
               {icons[notif.type] || icons.info}
            </div>
            
            <div className="space-y-4 flex-1 min-w-0">
               <div className="flex flex-wrap items-center gap-4">
                  <h3 className={cn(
                    "text-2xl font-black tracking-tight leading-none uppercase",
                    isUnread ? "text-slate-900" : "text-slate-500"
                  )}>
                    {notif.title}
                  </h3>
                  {isUnread && (
                    <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  )}
                  <Badge className={cn("rounded-full px-5 py-1.5 text-[9px] font-black uppercase tracking-widest border-0", priorities[notif.priority])}>
                     {notif.priority}
                  </Badge>
               </div>
               <p className={cn(
                 "text-[17px] font-medium leading-relaxed max-w-2xl",
                 isUnread ? "text-slate-600" : "text-slate-400 italic"
               )}>
                 {notif.message}
               </p>
               
               <div className="flex flex-wrap items-center gap-8 pt-4">
                  <div className="flex items-center gap-3 text-[11px] font-black text-slate-300 uppercase tracking-widest">
                     <Clock className="w-4 h-4" />
                     {new Date(notif.created_at).toLocaleString()}
                  </div>
                  {notif.sender_id && (
                    <div className="flex items-center gap-3 text-[11px] font-black text-indigo-400 uppercase tracking-widest">
                       <Database className="w-4 h-4" />
                       ENCRYPTED SOURCE: {notif.sender_id.name.toUpperCase()}
                    </div>
                  )}
               </div>
            </div>
         </div>
 
         <div className="flex items-center gap-6 shrink-0">
            {isUnread && (
              <button 
                onClick={onRead}
                className="h-16 w-16 rounded-[1.8rem] bg-indigo-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all group/btn"
              >
                <Check className="w-7 h-7 group-hover/btn:rotate-12 transition-transform" strokeWidth={3} />
              </button>
            )}
            <button 
              onClick={onDelete}
              className="h-16 w-16 rounded-[1.8rem] bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group/del"
            >
              <Trash2 className="w-6 h-6 group-hover/del:rotate-12 transition-transform" />
            </button>
         </div>
      </div>
    </motion.div>
  )
}
 
export default function InstructorNotificationsPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-16 w-16 border-[6px] border-amber-500/10 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] animate-pulse">Synchronizing Intelligence Streams</p>
       </div>
    }>
       <NotificationsContent />
    </Suspense>
  )
}
