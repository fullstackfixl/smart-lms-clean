import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle: string
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * EmptyState component for displaying when no data is available
 * Features:
 * - 64px icon with minimal stroke
 * - Centered layout with proper spacing
 * - Optional CTA button
 * - Full light/dark theme support
 */
export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon className="h-16 w-16 text-slate-400 dark:text-slate-500 stroke-1 mb-4" />
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-base text-slate-500 dark:text-slate-400 mb-6 max-w-md">{subtitle}</p>
      {action && (
        <Button 
          onClick={action.onClick} 
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
