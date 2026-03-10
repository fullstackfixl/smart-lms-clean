"use client"

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'

interface BasicChartProps {
  type: 'line' | 'bar'
  data: any[]
  xKey: string
  yKey: string
  height?: number
  className?: string
}

export function BasicChart({
  type,
  data,
  xKey,
  yKey,
  height = 300,
  className
}: BasicChartProps) {
  if (type === 'line') {
    return (
      <div className={className} style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey={xKey} 
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
            <Tooltip 
              contentStyle={{ 
                borderRadius: '6px', 
                border: '1px solid #E2E8F0',
                boxShadow: 'none',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke="#3B82F6" 
              strokeWidth={2} 
              dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey={xKey} 
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
          <Tooltip 
            contentStyle={{ 
              borderRadius: '6px', 
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey={yKey} 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#F97316'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
