"use client"

import { useEffect, useState } from "react"
import { useAuth } from '../../../lib/auth-context'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Settings, Building, Palette, Bell } from "lucide-react"
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'

export default function SettingsPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [orgSettings, setOrgSettings] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logo: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6"
  })
  const [orgCode, setOrgCode] = useState("")
  const [orgId, setOrgId] = useState("")
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token || !user) return

      try {
        setLoadingSettings(true)

        // Use /auth/me endpoint which already has organization data
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()

          if (data.success && data.data) {
            const userData = data.data

            // Set organization codes from user data
            setOrgCode(userData.organization_code || "N/A")
            setOrgId(userData.organization_id || "N/A")

            // Set organization name if available
            if (userData.organizationName) {
              setOrgSettings(prev => ({
                ...prev,
                name: userData.organizationName
              }))
            }
          }
        } else {
          toast.error('Failed to load organization settings')
        }

      } catch (error) {
        console.error('Failed to fetch settings:', error)
        toast.error('Failed to load organization settings')
      } finally {
        setLoadingSettings(false)
      }
    }

    if (user && token) {
      fetchSettings()
    }
  }, [user, token])

  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization preferences</p>
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Organization Name</Label>
            <Input
              value={orgSettings.name}
              onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
              placeholder="My School"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={orgSettings.email}
              onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
              placeholder="contact@school.com"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={orgSettings.phone}
              onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              value={orgSettings.address}
              onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
              placeholder="123 Main St, City, Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding & Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Logo URL</Label>
            <Input
              value={orgSettings.logo}
              onChange={(e) => setOrgSettings({ ...orgSettings, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground mt-1">Upload your logo and paste the URL here</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={orgSettings.primaryColor}
                  onChange={(e) => setOrgSettings({ ...orgSettings, primaryColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={orgSettings.primaryColor}
                  onChange={(e) => setOrgSettings({ ...orgSettings, primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={orgSettings.secondaryColor}
                  onChange={(e) => setOrgSettings({ ...orgSettings, secondaryColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={orgSettings.secondaryColor}
                  onChange={(e) => setOrgSettings({ ...orgSettings, secondaryColor: e.target.value })}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive email updates about important events</p>
            </div>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Fee Reminders</p>
              <p className="text-sm text-muted-foreground">Send automatic reminders for pending fees</p>
            </div>
            <input type="checkbox" className="h-5 w-5" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Attendance Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified about low attendance rates</p>
            </div>
            <input type="checkbox" className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Organization Code (6-char)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-lg">{orgCode || 'Loading...'}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(orgCode)
                    toast.success('6-character code copied!')
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this 6-character code with students and instructors for easy registration
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Organization ID (24-char)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{orgId || 'Loading...'}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(orgId)
                    toast.success('24-character ID copied!')
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Alternative registration code (MongoDB ObjectId) - both codes work for registration
            </p>
          </div>

          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm">Admin Email</span>
            <span className="font-semibold">{user.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Account Created</span>
            <span className="font-semibold">{new Date().toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  )
}
