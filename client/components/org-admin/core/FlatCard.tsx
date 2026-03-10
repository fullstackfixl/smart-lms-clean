"use client"
 
import React from "react"
import { cn } from "../../../lib/utils"
 
interface FlatCardProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}
 
export function FlatCard({ children, className, noPadding = false }: FlatCardProps) {
  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-md overflow-hidden",
      !noPadding && "p-6",
      className
    )}>
      {children}
    </div>
  )
}
