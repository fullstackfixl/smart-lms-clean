"use client"
 
import React from "react"
import { cn } from "../../../lib/utils"
 
interface StatusBadgeProps {
  type: 'active' | 'suspended' | 'pending' | 'success' | 'error' | 'blue'
  children: React.ReactNode
}
 
export function StatusBadge({ type, children }: StatusBadgeProps) {
  const styles = {
    active: "text-[#3B82F6] font-bold", // "blue bg for active" per request
    success: "text-[#10B981]",
    suspended: "text-[#EF4444]",
    error: "text-[#EF4444]",
    pending: "text-slate-500",
    blue: "text-[#3B82F6]"
  }
 
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
      type === 'active' ? "bg-blue-50 text-[#3B82F6]" : 
      type === 'success' ? "bg-green-50 text-[#10B981]" :
      type === 'suspended' || type === 'error' ? "bg-red-50 text-[#EF4444]" :
      "bg-gray-50 text-slate-500",
      type === 'blue' && "bg-blue-50 text-[#3B82F6]"
    )}>
      {children}
    </span>
  )
}
