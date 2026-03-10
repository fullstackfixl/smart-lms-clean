"use client"
 
import { cn } from "../../../lib/utils"
 
interface MinimalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}
 
export function MinimalInput({ label, error, className, ...props }: MinimalInputProps) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest px-1">
        {label}
      </label>
      <input
        {...props}
        className={cn(
          "w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[14px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
      />
      {error && <p className="text-[11px] font-bold text-red-500 px-1">{error}</p>}
    </div>
  )
}
 
export function MinimalSelect({ label, error, children, className, ...props }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest px-1">
        {label}
      </label>
      <select
        {...props}
        className={cn(
          "w-full h-11 px-4 bg-white border border-gray-300 rounded-md text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all appearance-none cursor-pointer",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
      >
        {children}
      </select>
      {error && <p className="text-[11px] font-bold text-red-500 px-1">{error}</p>}
    </div>
  )
}
