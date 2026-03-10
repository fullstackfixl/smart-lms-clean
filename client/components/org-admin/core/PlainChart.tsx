"use client"
 
import React from "react"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts"
 
interface ChartProps {
  data: any[]
  type: 'line' | 'bar'
  dataKey: string
  height?: number
}
 
export function PlainChart({ data, type, dataKey, height = 300 }: ChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748B' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748B' }} 
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#3B82F6" 
              strokeWidth={3} 
              dot={false} 
              isAnimationActive={false} 
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748B' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748B' }} 
            />
            <Bar 
              dataKey={dataKey} 
              fill="#F97316" 
              isAnimationActive={false} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
