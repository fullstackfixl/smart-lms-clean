"use client"
 
import { cn } from "../../../lib/utils"
 
interface FlatTableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}
 
export function FlatTable({ headers, children, className }: FlatTableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left border-collapse border-b border-gray-100">
        <thead className="bg-[#F8FAFC] border-y border-gray-100">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
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
 
export function FlatRow({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        "group transition-colors h-14 align-middle",
        onClick && "cursor-pointer",
        "hover:bg-blue-50/30 focus-within:bg-blue-50/50",
        className
      )}
    >
      {children}
    </tr>
  )
}
 
export function FlatCell({ children, className, bold = false, colSpan }: { children: React.ReactNode, className?: string, bold?: boolean, colSpan?: number }) {
  return (
    <td 
      colSpan={colSpan}
      className={cn(
      "px-6 py-4 text-[13.5px] leading-tight",
      bold ? "font-bold text-slate-900 italic-none" : "font-medium text-slate-600",
      className
    )}>
      {children}
    </td>
  )
}
