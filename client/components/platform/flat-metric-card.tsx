"use client"

import React from 'react'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'
import { LucideIcon } from 'lucide-react'

interface FlatMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function FlatMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className
}: FlatMetricCardProps) {
  return (
    <Card className={cn("border-slate-200 bg-white p-6 rounded-xl shadow-sm shadow-slate-100/60 hover:shadow-md hover:shadow-slate-100 transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span className={cn(
                  "text-xs font-semibold",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-slate-400">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="rounded-lg bg-blue-50 p-2.5">
          <Icon className="h-5 w-5 text-blue-500 stroke-[1.5]" />
        </div>
      </div>
    </Card>
  )
}
