"use client"

import { Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PlatformConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Configuration</h1>
        <p className="text-muted-foreground">Configure platform settings</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Settings className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Configuration options coming soon</p>
            <p className="text-sm text-muted-foreground">Manage system-wide settings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
