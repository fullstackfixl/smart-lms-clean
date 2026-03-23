"use client"
 
import { Bell, Search } from "lucide-react"
import { Button } from '../../components/ui/button'
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useAuth } from "../../lib/auth-context"
import { UserAvatar } from "../ui/UserAvatar"
 
interface InstructorHeaderProps {
  userName?: string
  userEmail?: string
}
 
export function InstructorHeader({ userName = "Instructor", userEmail = "instructor@example.com" }: InstructorHeaderProps) {
  const router = useRouter()
  const { user, logout, organization } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-8">
      <div className="flex w-full max-w-xl items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search across courses, students..."
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
            <Button variant="ghost" className="flex items-center space-x-2 px-2 hover:bg-gray-50 h-auto py-1.5">
              <UserAvatar 
                name={user?.name || userName} 
                src={user?.profilePicture} 
                size="sm" 
              />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name || userName}</p>
                <p className="text-[11px] text-slate-500 leading-tight">{organization?.name || 'Instructor'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-md border-gray-200 shadow-none">
            <DropdownMenuLabel>Instructor Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/instructor/profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/instructor/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={logout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
