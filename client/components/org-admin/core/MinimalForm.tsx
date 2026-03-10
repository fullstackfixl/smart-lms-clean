"use client"
 
import React from "react"
import { cn } from "../../../lib/utils"
 
interface MinimalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}
 
export function MinimalInput({ label, className, ...props }: MinimalInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{label}</label>
      <input 
        className={cn(
          "w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-[14px] text-slate-900 focus:outline-none focus:border-[#3B82F6] transition-all",
          className
        )}
        {...props}
      />
    </div>
  )
}
 
interface MinimalSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { label: string, value: string }[]
}
 
export function MinimalSelect({ label, options, className, ...props }: MinimalSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{label}</label>
      <select 
        className={cn(
          "w-full h-10 px-3 bg-white border border-gray-300 rounded-md text-[14px] text-slate-900 focus:outline-none focus:border-[#3B82F6] cursor-pointer transition-all",
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
 
interface MinimalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text'
}
 
export function MinimalButton({ children, variant = 'primary', className, ...props }: MinimalButtonProps) {
  const styles = {
    primary: "bg-[#3B82F6] text-white hover:bg-[#2563EB]",
    secondary: "text-[#F97316] font-bold hover:underline", // Secondary is orange text link for CTAs per request
    outline: "bg-white border border-gray-300 text-slate-700 hover:bg-gray-50",
    text: "text-[#3B82F6] font-bold hover:underline"
  }
  
  return (
    <button 
      className={cn(
        "h-10 px-6 rounded-md text-[13px] font-bold transition-all duration-150 active:scale-95 disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
