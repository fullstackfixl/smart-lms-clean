"use client"
 
import React from "react"
import { cn } from "../../../lib/utils"
 
interface TextTableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}
 
export function TextTable({ headers, children, className }: TextTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-4 text-[12px] font-bold text-slate-700 uppercase tracking-tight">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  )
}
 
export function TextRow({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        "group transition-colors h-14 align-middle",
        onClick && "cursor-pointer",
        "focus-within:bg-blue-50/50 hover:bg-gray-50/50",
        className
      )}
    >
      {children}
    </tr>
  )
}
 
export function TextCell({ children, className, bold = false, colSpan }: { children: React.ReactNode, className?: string, bold?: boolean, colSpan?: number }) {
  return (
    <td 
      colSpan={colSpan}
      className={cn(
        "px-6 py-4 text-[14px] leading-tight",
        bold ? "font-bold text-slate-900" : "font-medium text-slate-700",
        className
      )}
    >
      {children}
    </td>
  )
}
