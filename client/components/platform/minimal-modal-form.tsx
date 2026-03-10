"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface MinimalModalFormProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
  submitLabel?: string
  loading?: boolean
  className?: string
}

export function MinimalModalForm({
  isOpen,
  onClose,
  title,
  description,
  onSubmit,
  children,
  submitLabel = "Save Changes",
  loading = false,
  className
}: MinimalModalFormProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-[500px] border-none rounded-md p-0 overflow-hidden", className)}>
        <form onSubmit={onSubmit}>
          <div className="bg-white p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-slate-500">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
            
            <div className="space-y-4">
              {children}
            </div>
          </div>
          
          <DialogFooter className="bg-gray-50 p-4 flex flex-row justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white border-gray-200 text-slate-600 hover:bg-gray-50 rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-6"
            >
              {loading ? "Processing..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
