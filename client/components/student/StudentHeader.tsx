"use client"

import { useAuth } from '../../lib/auth-context'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { ChevronDown, User, LogOut } from "lucide-react"

export function StudentHeader() {
    const { user, logout, organization } = useAuth()

    return (
        <header className="fixed top-0 right-0 left-0 md:left-[240px] h-16 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/50 z-40 px-8 flex items-center justify-between shadow-2xl">
            <div className="flex-1 hidden md:block">
                <h1 className="text-lg font-black text-slate-100 tracking-tight">
                    Hi, <span className="text-emerald-500">{user?.name || 'Learner'}</span> 👋
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest -mt-1">Let&apos;s excel today</p>
            </div>

            <div className="flex items-center gap-6 ml-auto">
                <div className="relative group cursor-pointer hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                    <User className="h-4 w-4" />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all outline-none group">
                        {organization?.branding?.logo || (organization as any)?.logo_url ? (
                            <div className="h-8 w-8 rounded-lg bg-slate-900/30 border border-slate-700/50 overflow-hidden flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={(organization?.branding?.logo || (organization as any)?.logo_url) as string}
                                    alt="Organization logo"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform group-hover:scale-105">
                                {user?.name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-bold text-slate-100 leading-none">{user?.name || 'Learner'}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-1">{organization?.name || 'Student'}</p>
                        </div>
                        <ChevronDown className="h-3 w-3 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900/90 backdrop-blur-xl border-slate-800 p-2 shadow-2xl">
                        <DropdownMenuItem className="gap-3 cursor-pointer rounded-lg py-2.5 focus:bg-emerald-500/10 focus:text-emerald-400 text-slate-300 transition-colors">
                            <User className="h-4 w-4" />
                            <span className="font-semibold text-sm">My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="gap-3 cursor-pointer rounded-lg py-2.5 focus:bg-red-500/10 focus:text-red-400 text-slate-300 transition-colors mt-1"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="font-semibold text-sm">Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
