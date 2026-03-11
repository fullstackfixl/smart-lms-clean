"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"

export function PlatformErrorState({ title = "Something went wrong", message = "We couldn't load this data. Please try again." }: { title?: string; message?: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-8">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-md border border-orange-200 bg-orange-50 flex items-center justify-center text-orange-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{message}</div>
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-10 rounded-md border-gray-200 bg-white font-bold text-slate-700 hover:bg-gray-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reload
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
