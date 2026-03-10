"use client"

import React from 'react'
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Lock, 
  Database,
  ChevronRight,
  Check
} from 'lucide-react'
import { SimpleCard } from '../../../components/platform/ui-standard'
import { Button } from '../../../components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            Global Settings
          </h1>
          <p className="mt-2 text-slate-500">Ecosystem configuration and institutional governance.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-none font-bold px-8 transition-all">
          <Check className="mr-2 h-4 w-4" /> Save Core Flux
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <Button variant="ghost" className="w-full justify-between bg-blue-50 text-blue-600 font-bold hover:bg-blue-50">
            <span className="flex items-center"><Settings className="mr-3 h-4 w-4" /> General</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between text-slate-500 hover:bg-gray-50 hover:text-slate-900">
            <span className="flex items-center"><Shield className="mr-3 h-4 w-4" /> Security & IAM</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between text-slate-500 hover:bg-gray-50 hover:text-slate-900">
            <span className="flex items-center"><Bell className="mr-3 h-4 w-4" /> Communication</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-3">
          <Accordion type="single" collapsible defaultValue="general" className="w-full space-y-4 border-none">
            <AccordionItem value="general" className="border-none">
              <SimpleCard className="p-0 overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
                  <div className="flex items-center text-left">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <Globe className="h-5 w-5 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">General Parameters</h3>
                      <p className="text-sm text-slate-500">Identity, localization, and branding.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-8 pt-4 border-t border-gray-50">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Ecosystem Name</label>
                      <input 
                        type="text" 
                        defaultValue="Smart LMS Global"
                        className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Primary Language</label>
                      <select className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-4 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-none">
                        <option>English (Universal)</option>
                        <option>Spanish</option>
                        <option>Hindi</option>
                      </select>
                    </div>
                  </div>
                </AccordionContent>
              </SimpleCard>
            </AccordionItem>

            <AccordionItem value="security" className="border-none">
              <SimpleCard className="p-0 overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50/50">
                  <div className="flex items-center text-left">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                      <Lock className="h-5 w-5 stroke-[1.5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Security & Authentication</h3>
                      <p className="text-sm text-slate-500">IAM policies and session management.</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-8 pt-4 border-t border-gray-50">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-100">
                      <div>
                        <p className="font-bold text-slate-900">Multi-Factor Authentication (MFA)</p>
                        <p className="text-xs text-slate-500 mt-0.5">Mandatory for all Platform Staff and Admins.</p>
                      </div>
                      <div className="h-6 w-11 bg-blue-600 rounded-full relative cursor-pointer shadow-none">
                        <div className="h-5 w-5 bg-white rounded-full absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-100">
                      <div>
                        <p className="font-bold text-slate-900">Organization Self-Registration</p>
                        <p className="text-xs text-slate-500 mt-0.5">Allows new institutions to sign up via public funnel.</p>
                      </div>
                      <div className="h-6 w-11 bg-gray-200 rounded-full relative cursor-pointer shadow-none">
                        <div className="h-5 w-5 bg-white rounded-full absolute top-0.5 left-0.5" />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </SimpleCard>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}
