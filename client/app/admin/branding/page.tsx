"use client"

import { Palette } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'

export default function AdminBrandingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Branding Settings</h1>
        <p className="text-muted-foreground">Customize your organization's appearance</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Brand Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Palette className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Branding options coming soon</p>
            <p className="text-sm text-muted-foreground">Customize colors, logos, and themes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
