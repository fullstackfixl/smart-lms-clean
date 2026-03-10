"use client"

import React from 'react'
import { 
  Puzzle, 
  Search, 
  Plus, 
  Settings2, 
  ExternalLink,
  CheckCircle2,
  Zap,
  Globe,
  Database,
  Mail,
  MessageSquare
} from 'lucide-react'
import { 
  SimpleCard, 
  SimpleBadge 
} from '../../../components/platform/ui-standard'
import { Button } from '../../../components/ui/button'

const apps = [
  { id: 'zoom', name: 'Zoom Video', icon: Globe, category: 'Communication', status: 'connected', description: 'Real-time virtual classrooms and webinars.' },
  { id: 'stripe', name: 'Stripe Payments', icon: Zap, category: 'Finance', status: 'connected', description: 'Universal payment gateway and subscription logic.' },
  { id: 'aws', name: 'AWS S3', icon: Database, category: 'Storage', status: 'connected', description: 'Cloud-native content delivery and asset storage.' },
  { id: 'sendgrid', name: 'SendGrid', icon: Mail, category: 'Email', status: 'disconnected', description: 'Automated notification engine and bulk delivery.' },
  { id: 'slack', name: 'Slack Connect', icon: MessageSquare, category: 'Ops', status: 'disconnected', description: 'Internal team coordination and automated alerts.' },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-600 inline-block pb-1">
            App Integrations
          </h1>
          <p className="mt-2 text-slate-500">Connect and manage third-party infrastructure nodes.</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-none">
          <Plus className="mr-2 h-4 w-4" /> Discover Apps
        </Button>
      </div>

      {/* Logic Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search integrations..."
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-none transition-all"
          />
        </div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <SimpleCard key={app.id} className="relative group hover:border-blue-200">
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors`}>
                <app.icon className="h-6 w-6 stroke-[1.5]" />
              </div>
              <SimpleBadge variant={app.status === 'connected' ? 'green' : 'gray'}>
                {app.status}
              </SimpleBadge>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{app.name}</h3>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">{app.category}</p>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              {app.description}
            </p>
            <div className="flex items-center space-x-2 border-t border-gray-100 pt-4">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-gray-50 flex-1 font-semibold text-xs h-8">
                <Settings2 className="mr-2 h-3.5 w-3.5" /> Configure
              </Button>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 flex-1 font-semibold text-xs h-8">
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Docs
              </Button>
            </div>
          </SimpleCard>
        ))}
      </div>

      {/* Manual Webhook Section */}
      <SimpleCard className="flex items-center justify-between bg-gray-50 border-dashed border-gray-300">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-orange-600 border border-gray-100 shadow-sm">
            <Puzzle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Custom Webhook Integration</h4>
            <p className="text-sm text-slate-500">Provision your own API endpoints for automated telemetry.</p>
          </div>
        </div>
        <Button variant="outline" className="text-slate-700 bg-white border-gray-200 hover:bg-gray-50 shadow-none font-bold">
          Provision Secret
        </Button>
      </SimpleCard>
    </div>
  )
}
