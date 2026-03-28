"use client"

import React from 'react'
import { Search, Bell, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useAuth } from '../../lib/auth-context'
import { UserAvatar } from '../ui/UserAvatar'

export function PlatformStaffHeader() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const displayName = user?.name || 'Platform Staff'

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      <div className="flex w-full max-w-2xl items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.75]" />
          <input
            type="text"
            placeholder="Search across organizations, users, courses..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900">
          <Bell className="h-5 w-5 stroke-[1.75]" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 rounded-lg px-2 py-1.5 focus:outline-none group hover:bg-slate-50 transition-colors">
              <UserAvatar 
                name={displayName} 
                src={user?.profilePicture} 
                size="sm" 
              />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{displayName}</p>
                <p className="mt-1 text-xs text-slate-500">Platform Staff</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg border-slate-200 shadow-none p-1">
            <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">My Account</DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer rounded-md text-sm text-slate-700 focus:bg-orange-50 focus:text-orange-600"
              onClick={() => router.push('/platform-staff/dashboard')}
            >
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100 mx-1 my-1" />
            <DropdownMenuItem
              className="cursor-pointer rounded-md text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
              onClick={() => {
                logout()
                router.push('/login')
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
