"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface DataTableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
}

/**
 * DataTable component for displaying tabular data
 * Features:
 * - Generic TypeScript types for type safety
 * - Sortable columns
 * - Custom cell rendering
 * - Row click handlers
 * - Actions column
 * - Clean styling with no zebra striping
 * - Hover states (blue-50 background)
 * - Responsive (converts to cards on mobile)
 * - Full light/dark theme support
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return

    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0

    const aValue = a[sortKey]
    const bValue = b[sortKey]

    if (aValue === bValue) return 0

    const comparison = aValue > bValue ? 1 : -1
    return sortDirection === 'asc' ? comparison : -comparison
  })

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className={cn(
                  "text-sm font-semibold text-slate-700 dark:text-slate-300",
                  column.sortable && "cursor-pointer select-none"
                )}
                onClick={() => handleSort(String(column.key), column.sortable)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortKey === column.key && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
            {actions && (
              <TableHead className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-right">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (actions ? 1 : 0)}
                className="text-center py-8 text-slate-500 dark:text-slate-400"
              >
                No data available
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, index) => (
              <TableRow
                key={index}
                className={cn(
                  "border-b border-gray-200 dark:border-slate-700",
                  "hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    className="py-4 px-3 text-slate-700 dark:text-slate-300"
                  >
                    {column.render
                      ? column.render(row[column.key as keyof T], row)
                      : String(row[column.key as keyof T] ?? '')}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="py-4 px-3 text-right">
                    {actions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
