"use client"
 
import { cn } from "../../../lib/utils"
 
interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}
 
export function SimpleButton({ variant = 'primary', size = 'md', children, className, ...props }: SimpleButtonProps) {
  const variants: any = {
    primary: "bg-[#3B82F6] text-white hover:bg-[#2563EB]",
    secondary: "bg-[#F97316] text-white hover:bg-[#EA580C]",
    outline: "bg-white border border-gray-300 text-slate-600 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:bg-red-600"
  }
 
  const sizes: any = {
    sm: "h-9 px-4 text-[12px]",
    md: "h-11 px-6 text-[13.5px]",
    lg: "h-13 px-8 text-[15px]"
  }
 
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none tracking-tight leading-none",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  )
}
