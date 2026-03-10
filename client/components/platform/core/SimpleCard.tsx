"use client"
 
import { cn } from "../../../lib/utils"
 
interface SimpleCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  className?: string
  noPadding?: boolean
}
 
export function SimpleCard({ children, title, subtitle, icon, className, noPadding = false }: SimpleCardProps) {
  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-md overflow-hidden",
      className
    )}>
      {(title || subtitle || icon) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-3">
              {icon && <div className="text-[#3B82F6]">{icon}</div>}
              <div>
                 {title && <h3 className="text-[17px] font-bold text-slate-900 leading-none">{title}</h3>}
                 {subtitle && <p className="text-[12px] text-slate-500 mt-1">{subtitle}</p>}
              </div>
           </div>
        </div>
      )}
      <div className={cn(noPadding ? "p-0" : "p-6")}>
        {children}
      </div>
    </div>
  )
}
 
export function MetricCard({ label, value, trend, icon, color = "blue" }: any) {
  const iconColors: any = {
    blue: "text-[#3B82F6] bg-blue-50/50",
    orange: "text-[#F97316] bg-orange-50/50",
    green: "text-[#10B981] bg-green-50/50",
    rose: "text-[#EF4444] bg-rose-50/50"
  }
 
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6 group transition-all duration-150 hover:border-[#3B82F6]/30">
       <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-sm", iconColors[color])}>
             {icon}
          </div>
          {trend && (
             <span className={cn(
               "text-[12px] font-bold",
               trend.includes('+') ? "text-[#F97316]" : "text-slate-400"
             )}>
                {trend}
             </span>
          )}
       </div>
       <div className="mt-4 space-y-1">
          <p className="text-[12px] font-medium text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
       </div>
    </div>
  )
}
