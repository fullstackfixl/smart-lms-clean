"use client"
 
import { Bell, User, Search, Zap, ShieldCheck, ChevronDown, Command } from "lucide-react"
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { ThemeToggle } from "./theme-toggle"
 
interface InstructorHeaderProps {
  userName?: string
  userEmail?: string
}
 
export function InstructorHeader({ userName = "Instructor", userEmail = "instructor@example.com" }: InstructorHeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
 
  return (
    <header className="sticky top-0 z-[40] flex h-24 items-center justify-between border-b bg-white/60 backdrop-blur-2xl px-10 border-slate-100 transition-all duration-500">
      
      {/* ─── Search Intel Surface ──────────────────────────────────────── */}
      <div className="flex-1">
        <div className="relative max-w-xl hidden md:block group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-all duration-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search curricula, scholars or broadcasts..." 
            className="w-full h-14 pl-14 pr-16 bg-slate-50 border border-slate-100/50 rounded-2xl text-[14px] font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-[6px] focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all shadow-sm"
          />
          <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] font-black text-slate-400 shadow-sm">
               <Command className="w-3 h-3" />
               <span>K</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ─── Global Status & Controls ─────────────────────────────────── */}
      <div className="flex items-center gap-8">
        
        {/* Global Status Pill (GSP) - Peak Edition */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100/50 group cursor-default">
           <div className="relative flex h-2.5 w-2.5">
              <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
              <div className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
           </div>
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] group-hover:tracking-[0.25em] transition-all">Satellite Link Active</span>
        </div>
 
        <div className="flex items-center gap-4">
          <button className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 transition-all relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
 
          <ThemeToggle />
          
          <div className="h-8 w-px bg-slate-100 mx-2" />
 
          {/* User Executive Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-4 p-1 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                <Avatar className="h-12 w-12 rounded-[1.2rem] shadow-sm group-hover:scale-105 transition-transform">
                  <AvatarFallback className="bg-indigo-600 text-[13px] font-black text-white rounded-[1.2rem]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start pr-4">
                   <div className="flex items-center gap-2">
                      <span className="text-[14px] font-black text-slate-900 tracking-tight">{userName}</span>
                      <ChevronDown className="w-4 h-4 text-slate-300 group-hover:translate-y-0.5 transition-transform" strokeWidth={3} />
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userEmail}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3 rounded-[1.8rem] border-slate-100 shadow-2xl shadow-indigo-500/10 animate-in zoom-in-95 duration-200">
              <DropdownMenuLabel className="px-4 py-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Authenticated Identity</p>
                 <p className="text-[15px] font-black text-slate-900">{userName}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-50" />
              <div className="p-1 space-y-1">
                <DropdownMenuItem className="h-12 rounded-xl focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer px-4 font-bold text-[13px] flex items-center gap-3">
                  <User className="w-4 h-4" /> Instructor Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="h-12 rounded-xl focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer px-4 font-bold text-[13px] flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" /> Security Settings
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem 
                className="h-12 rounded-xl focus:bg-rose-50 focus:text-rose-600 text-rose-500 cursor-pointer px-4 font-bold text-[13px] flex items-center gap-3 mt-1"
                onClick={() => {
                  window.localStorage.removeItem('instatute_token')
                  window.sessionStorage.removeItem('instatute_token')
                  window.location.href = '/login'
                }}
              >
                Logout Console
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
