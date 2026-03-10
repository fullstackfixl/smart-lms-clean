import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Learnyst-style Flat Card
 */
export function SimpleCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md border border-gray-200 bg-white p-6 transition-all duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Learnyst-style Flat Table
 */
export function FlatTable({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function FlatTableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-gray-50 border-b border-gray-200", className)} {...props} />
}

export function FlatTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-gray-100 transition-colors hover:bg-blue-50/50 data-[state=selected]:bg-blue-50",
        className
      )}
      {...props}
    />
  )
}

export function FlatTableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
}

/**
 * Learnyst-style Badge
 */
export function SimpleBadge({ 
  className, 
  variant = 'blue', 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'blue' | 'orange' | 'green' | 'gray' | 'red' }) {
  const variants = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-green-50 text-green-600 border-green-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
    red: "bg-red-50 text-red-600 border-red-100",
  }
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
