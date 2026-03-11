"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Lock, 
  Database,
  ChevronRight,
  Check,
  Mail,
  Zap,
  Layout,
  Save,
  Loader2
} from 'lucide-react'
import { Card } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion"
import { toast } from "sonner"
import { cn } from '../../../lib/utils'
import { platformJsonFetcher } from '../../../lib/platform-fetcher'
import { PlatformErrorState } from '../../../components/platform/platform-error-state'

export default function SettingsPage() {
  const { data: response, error, isLoading, mutate } = useSWR('/api/platform/settings', platformJsonFetcher)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<any>(null)

  if (error) {
    return <PlatformErrorState />
  }

  // Initialize form data when SWR finishes
  React.useEffect(() => {
    if (response?.success && !formData) {
      setFormData(response.data)
    }
  }, [response, formData])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/platform/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Ecosystem parameters synchronized successfully")
        mutate()
      } else {
        toast.error(data.message || "Failed to commit settings")
      }
    } catch (err) {
      toast.error("Network synchronization failure")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !formData) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            Global Configuration
          </h1>
          <p className="mt-2 text-slate-500">
            Governing parameters for the entire multi-tenant educational ecosystem.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-none h-11"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Commit Flux
        </Button>
      </div>

      {/* Settings Grid */}
      <Accordion type="single" collapsible defaultValue="general" className="w-full space-y-4">
        
        {/* General Settings */}
        <AccordionItem value="general" className="border-none">
          <Card className="border-gray-200 no-shadow rounded-md overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center text-left">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Globe className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Ecosystem Branding</h3>
                  <p className="text-sm text-slate-500">Platform identity and public representation.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Name</Label>
                  <Input 
                    value={formData.platformName} 
                    onChange={(e) => setFormData({...formData, platformName: e.target.value})}
                    className="h-10 border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Support Email</Label>
                  <Input 
                    value={formData.supportEmail} 
                    onChange={(e) => setFormData({...formData, supportEmail: e.target.value})}
                    className="h-10 border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Global Footer Text</Label>
                  <Input 
                    value={formData.footerText} 
                    onChange={(e) => setFormData({...formData, footerText: e.target.value})}
                    className="h-10 border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Security Settings */}
        <AccordionItem value="security" className="border-none">
          <Card className="border-gray-200 no-shadow rounded-md overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center text-left">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                  <Shield className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Security & Authentication</h3>
                  <p className="text-sm text-slate-500">Enforcement of global IAM protocols.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 border-t border-gray-100">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-md border border-gray-100">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Force Multi-Factor Authentication</p>
                    <p className="text-xs text-slate-400">Mandatory for all Platform Administrative staff.</p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, forceMFA: !formData.forceMFA})}
                    className={cn(
                      "w-11 h-6 rounded-full transition-all relative",
                      formData.forceMFA ? "bg-blue-600" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      formData.forceMFA ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-md border border-gray-100">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Public Institution Registration</p>
                    <p className="text-xs text-slate-400">Allow organizations to request registration via public portal.</p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, publicReg: !formData.publicReg})}
                    className={cn(
                      "w-11 h-6 rounded-full transition-all relative",
                      formData.publicReg ? "bg-blue-600" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      formData.publicReg ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Feature Switches */}
        <AccordionItem value="features" className="border-none">
          <Card className="border-gray-200 no-shadow rounded-md overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
              <div className="flex items-center text-left">
                <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-600">
                  <Zap className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Feature Flux Switches</h3>
                  <p className="text-sm text-slate-500">Universal enablement of platform modules.</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-8 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                {['marketplace', 'ai_tools', 'webinars', 'advanced_analytics'].map((feat) => (
                  <div key={feat} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-md border border-gray-100">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{feat.replace('_', ' ')}</span>
                    <button 
                      onClick={() => setFormData({...formData, features: {...formData.features, [feat]: !formData.features[feat]}})}
                      className={cn(
                        "w-11 h-6 rounded-full transition-all relative",
                        formData.features?.[feat] ? "bg-blue-600" : "bg-gray-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.features?.[feat] ? "left-6" : "left-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </Card>
        </AccordionItem>

      </Accordion>
    </div>
  )
}
