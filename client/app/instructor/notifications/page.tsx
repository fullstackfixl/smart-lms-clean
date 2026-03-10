"use client"
 
import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, Check, CheckCheck, Trash2, Filter, AlertCircle,
  Info, CheckCircle2, XCircle, Clock, 
  Search, ShieldCheck, Zap, Sparkles, Database,
  Activity, ArrowUpRight, MousePointer2, Target, Globe,
  RefreshCcw, Layers
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
      toast.error("Failed to synchronize student alerts")
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
        toast.success("Notification marked as read")
        loadNotifications()
      }
    } catch {
      toast.error("Update failed")
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
        toast.success("All notifications marked as read")
        loadNotifications()
      }
    } catch {
      toast.error("Update failed")
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
        toast.success("Notification removed")
        loadNotifications()
      }
    } catch {
      toast.error("Removal failed")
    }
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Notification Streams Hero ─────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] transition-all">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-amber-50/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Bell className="w-80 h-80 -ml-20 -mb-20 rotate-12 text-amber-500" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-10 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-[0.25em] border border-amber-100/50">
                <Activity className="w-4 h-4" />
                Live Performance Alerts
              </div>
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Instructor <br />
                  <span className="text-amber-600">Notifications.</span>
                </h1>
                <p className="text-[19px] font-bold text-slate-500 leading-relaxed max-w-xl opacity-80 italic">
                  Keep track of all platform activities. Real-time updates on student progress, curriculum changes, and financial milestones delivered instantly.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="h-20 px-12 bg-slate-900 text-white rounded-[2.25rem] text-[15px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl group uppercase tracking-widest"
                  >
                    <CheckCheck className="w-6 h-6 group-hover:rotate-12 transition-transform stroke-[3]" />
                    Mark All as Read
                  </button>
                )}
                <div className="flex items-center gap-4 h-20 px-10 rounded-[2.25rem] border border-slate-100 bg-slate-50/50 backdrop-blur-sm shadow-inner">
                   <div className={cn("h-3 w-3 rounded-full animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]", unreadCount > 0 ? "bg-amber-500" : "bg-emerald-500")} />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                     {unreadCount > 0 ? `${unreadCount} New Alerts` : "All notifications read"}
                   </span>
                </div>
              </div>
            </div>
 
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-lg">
                <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl transition-all hover:border-amber-200 relative overflow-hidden group/m">
                   <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover/m:opacity-[0.1] transition-opacity">
                      <AlertCircle className="w-16 h-16 text-rose-500" strokeWidth={3} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Priority Alerts</p>
                   <p className="text-5xl font-black tracking-tighter tabular-nums text-slate-900 leading-none">
                     {notifications.filter(n => n.priority === 'urgent' && (n.status === 'pending' || n.status === 'sent')).length}
                   </p>
                   <p className="text-[11px] text-slate-400 font-bold italic mt-2 opacity-60">Action required soon</p>
                </div>
                <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl transition-all hover:border-indigo-200 relative overflow-hidden group/m">
                   <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover/m:opacity-[0.1] transition-opacity">
                      <Activity className="w-16 h-16 text-blue-500" strokeWidth={3} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System Updates</p>
                   <p className="text-5xl font-black tracking-tighter tabular-nums text-slate-900 leading-none">
                     {notifications.filter(n => n.type === 'warning' || n.type === 'error').length}
                   </p>
                   <p className="text-[11px] text-slate-400 font-bold italic mt-2 opacity-60">Platform logs & status</p>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Filter Section ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-8 px-6">
        <div className="bg-slate-50/50 p-2 rounded-[2.5rem] border border-slate-100 shadow-inner w-full lg:w-auto backdrop-blur-sm">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-16 w-full lg:w-[280px] rounded-[2.25rem] bg-white border-none shadow-sm px-10 font-black text-[12px] uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-amber-500/5">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-amber-500" strokeWidth={3} />
                <SelectValue placeholder="All Alerts" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-[2rem] p-3 border-slate-100 shadow-2xl">
              <SelectItem value="all" className="rounded-xl py-4 font-black text-xs uppercase tracking-widest">Display All Content</SelectItem>
              <SelectItem value="pending" className="rounded-xl py-4 font-black text-xs uppercase tracking-widest text-amber-600">Unread Notifications</SelectItem>
              <SelectItem value="read" className="rounded-xl py-4 font-black text-xs uppercase tracking-widest text-slate-400">Archived History</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-16 px-10 rounded-[2.25rem] border border-slate-100 bg-white/50 backdrop-blur-md flex items-center gap-5 ml-auto shadow-sm">
           <RefreshCcw className="w-4 h-4 text-slate-300 animate-spin-slow" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Link synchronized</p>
        </div>
      </div>
 
      {/* ─── Notification List ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="grid grid-cols-1 gap-10 px-6">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="h-44 rounded-[3.5rem] bg-slate-50 animate-pulse border border-slate-100" />
             ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border-2 border-dashed border-slate-100 rounded-[5rem] py-48 text-center m-6"
          >
             <div className="w-28 h-28 rounded-[3rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100 mx-auto shadow-inner relative">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-[3rem] blur-xl" />
                <Sparkles className="h-10 w-10 text-slate-200 relative z-10" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Alert Stream Clear</h3>
             <p className="text-[17px] font-bold text-slate-400 max-w-md mx-auto leading-relaxed italic opacity-80">
               {statusFilter !== 'all' ? 'No notifications found matching the current filter.' : 'Your notification dashboard is currently empty.'}
             </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-10 px-6">
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
    success: <CheckCircle2 className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />,
    error: <XCircle className="h-8 w-8 text-rose-500" strokeWidth={2.5} />,
    warning: <AlertCircle className="h-8 w-8 text-amber-500" strokeWidth={2.5} />,
    info: <Info className="h-8 w-8 text-indigo-500" strokeWidth={2.5} />,
  }
 
  const priorities: any = {
    urgent: "bg-rose-600 text-white shadow-lg shadow-rose-600/30",
    high: "bg-amber-100 text-amber-700 border border-amber-200/50",
    medium: "bg-indigo-50 text-indigo-700 border border-indigo-100/50",
    low: "bg-slate-50 text-slate-400 border border-slate-100",
  }
 
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.7, ease: "easeOut" }}
      className={cn(
        "group relative bg-white border rounded-[4rem] p-12 lg:p-16 transition-all duration-700 overflow-hidden hover:shadow-[0_48px_96px_-32px_rgba(0,0,0,0.06)]",
        isUnread 
          ? "border-amber-500/30 shadow-[0_40px_80px_-20px_rgba(245,158,11,0.08)] bg-white" 
          : "border-slate-100 opacity-90 hover:opacity-100"
      )}
    >
      <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
         {icons[notif.type] || icons.info}
      </div>
 
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
         
         <div className="flex items-start gap-10 flex-1 min-w-0 text-left">
            <div className={cn(
              "h-24 w-24 rounded-[2.5rem] flex items-center justify-center shrink-0 border-4 transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 shadow-xl",
              isUnread ? "bg-white border-amber-100 shadow-amber-500/10" : "bg-slate-50 border-white shadow-slate-200/50"
            )}>
               {icons[notif.type] || icons.info}
            </div>
            
            <div className="space-y-6 flex-1 min-w-0">
               <div className="flex flex-wrap items-center gap-5">
                  <h3 className={cn(
                    "text-3xl font-black tracking-tight leading-tight uppercase",
                    isUnread ? "text-slate-900" : "text-slate-500"
                  )}>
                    {notif.title}
                  </h3>
                  {isUnread && (
                    <div className="h-3.5 w-3.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                  )}
                  <div className={cn("rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm", priorities[notif.priority])}>
                     {notif.priority}
                  </div>
               </div>
               <p className={cn(
                 "text-[19px] font-bold leading-relaxed max-w-3xl",
                 isUnread ? "text-slate-600" : "text-slate-400 italic"
               )}>
                 {notif.message}
               </p>
               
               <div className="flex flex-wrap items-center gap-10 pt-4">
                  <div className="flex items-center gap-4 text-[11px] font-black text-slate-300 uppercase tracking-widest italic">
                     <Clock className="w-5 h-5 opacity-40 text-slate-400" />
                     {new Date(notif.created_at).toLocaleString()}
                  </div>
                  {notif.sender_id && (
                    <div className="flex items-center gap-4 text-[11px] font-black text-indigo-400 uppercase tracking-widest border-l border-slate-100 pl-10">
                       <Layers className="w-5 h-5 opacity-60" />
                       Source: {notif.sender_id.name.toUpperCase()}
                    </div>
                  )}
               </div>
            </div>
         </div>
 
         <div className="flex items-center gap-6 shrink-0">
            {isUnread && (
              <button 
                onClick={onRead}
                title="Mark as read"
                className="h-20 w-20 rounded-[2.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/20 hover:scale-110 active:scale-90 transition-all group/btn"
              >
                <Check className="w-8 h-8 group-hover/btn:rotate-12 transition-transform" strokeWidth={4} />
              </button>
            )}
            <button 
              onClick={onDelete}
              title="Delete notification"
              className="h-20 w-20 rounded-[2.25rem] bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm hover:shadow-xl hover:shadow-rose-600/20 group/del"
            >
              <Trash2 className="w-7 h-7 group-hover/del:rotate-12 transition-transform" />
            </button>
         </div>
      </div>
    </motion.div>
  )
}
 
export default function InstructorNotificationsPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[75vh] gap-10">
          <div className="relative">
            <div className="absolute -inset-6 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
            <div className="h-24 w-24 border-[8px] border-amber-50 border-t-amber-600 rounded-full animate-spin shadow-inner" />
          </div>
          <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.45em] animate-pulse italic text-center">Synchronizing Alert Registry...</p>
       </div>
    }>
       <NotificationsContent />
    </Suspense>
  )
}
