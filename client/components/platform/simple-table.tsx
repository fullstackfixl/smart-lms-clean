"use client"

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { cn } from "../../lib/utils"

interface SimpleTableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export function SimpleTable({ headers, children, className }: SimpleTableProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            {headers.map((header) => (
              <TableHead 
                key={header} 
                className="h-11 text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {children}
        </TableBody>
      </Table>
    </div>
  )
}

export function SimpleTableRow({ 
  children, 
  onClick, 
  className 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string 
}) {
  return (
    <TableRow 
      onClick={onClick}
      className={cn(
        "h-14 border-b border-slate-100 transition-colors",
        onClick ? "cursor-pointer hover:bg-blue-50/50" : "cursor-default hover:bg-slate-50/40",
        className
      )}
    >
      {children}
    </TableRow>
  )
}

export function SimpleTableCell({ 
  children, 
  className,
  ...props 
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <TableCell className={cn("text-sm text-slate-700", className)} {...props}>
      {children}
    </TableCell>
  )
}
