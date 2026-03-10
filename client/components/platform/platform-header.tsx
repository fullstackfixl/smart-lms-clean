"use client"

import React from 'react'
import { Search, Bell, User } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'

export function PlatformHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-8">
      <div className="flex w-full max-w-xl items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search across organizations, users..."
            className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-blue-600">
          <Bell className="h-5 w-5 stroke-[1.5]" />
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-2 hover:bg-gray-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-slate-900">Platform Admin</p>
                <p className="text-xs text-slate-500">Super User</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-md border-gray-200 shadow-none">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
