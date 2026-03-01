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
    const { user, logout } = useAuth()

    return (
        <header className="fixed top-0 right-0 left-0 md:left-[240px] h-16 bg-[#E0F7FA] border-b border-[#B2EBF2] z-40 px-6 flex items-center justify-between">
            <div className="flex-1 text-center hidden md:block">
                <h1 className="text-xl font-semibold text-[#006064]">
                    Hi {user?.name || 'Learner'}, Let&apos;s get started 👋
                </h1>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 hover:bg-white/80 border border-[#B2EBF2] transition-all outline-none">
                        <span className="text-sm font-medium text-[#006064]">View as student</span>
                        <ChevronDown className="h-4 w-4 text-[#006064]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <User className="h-4 w-4" />
                            <span>Profile Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-600 focus:text-red-700"
                            onClick={() => logout()}
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
