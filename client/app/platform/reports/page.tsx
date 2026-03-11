"use client"

import React, { useState } from 'react'
import useSWR from 'swr'
import { 
  Download, 
  FileText, 
  Plus, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileJson,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'
import { SimpleTable, SimpleTableRow, SimpleTableCell } from '../../../components/platform/simple-table'
import { MinimalModalForm } from '../../../components/platform/minimal-modal-form'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Label } from '../../../components/ui/label'
import { Input } from '../../../components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from '../../../lib/utils'
import { platformJsonFetcher } from '../../../lib/platform-fetcher'
import { PlatformErrorState } from '../../../components/platform/platform-error-state'

export default function ReportsPage() {
  const { data: response, error, isLoading, mutate } = useSWR('/api/platform/reports', platformJsonFetcher)
  const reports = response?.data || []

  if (error) {
    return <PlatformErrorState />
  }
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'enrollment',
    format: 'csv',
    range: 'last_30_days'
  })

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/platform/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Intelligence report synthesis initiated")
        setIsModalOpen(false)
        mutate()
      } else {
        toast.error(data.message || "Failed to initiate report")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
      case 'pdf': return <FileText className="h-4 w-4 text-orange-500" />
      case 'json': return <FileJson className="h-4 w-4 text-blue-500" />
      default: return <FileText className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 border-b-2 border-blue-500 inline-block pb-1">
            Intelligence Reports
          </h1>
          <p className="mt-2 text-slate-500">
            Synthesize and export deep-dive analytical matrices for internal stakeholders.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md px-6 shadow-none h-11"
        >
          <Plus className="mr-2 h-5 w-5 stroke-[3]" /> Generate Report
        </Button>
      </div>

      {/* Main Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 uppercase italic tracking-widest text-[11px] opacity-40">Report Generation Stream</h3>
          <Button variant="ghost" size="sm" onClick={() => mutate()} className="text-blue-500 hover:bg-blue-50 h-8 px-2">
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> Refresh Queue
          </Button>
        </div>

        <SimpleTable headers={['Report Identifier', 'Format', 'Source Hub', 'Status', 'Generated At', 'Actions']}>
          {reports.map((report: any) => (
            <SimpleTableRow key={report._id}>
              <SimpleTableCell>
                <div>
                  <div className="font-bold text-blue-600">{report.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {report._id.slice(-8)}</div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="flex items-center gap-2">
                  {getFormatIcon(report.format)}
                  <span className="text-xs font-bold uppercase text-slate-600">{report.format}</span>
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-3.5 w-3.5 opacity-40" />
                  <span className="text-xs font-medium uppercase">{report.type.replace('_', ' ')}</span>
                </div>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  report.status === 'ready' ? "bg-green-100 text-green-700" : 
                  report.status === 'processing' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                )}>
                  {report.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell className="text-slate-400 font-bold text-[10px] uppercase">
                {new Date(report.createdAt).toLocaleString()}
              </SimpleTableCell>
              <SimpleTableCell className="text-right">
                {report.status === 'ready' ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50">
                    <Download className="h-4 w-4" />
                  </Button>
                ) : (
                  <MoreHorizontal className="h-4 w-4 text-slate-200" />
                )}
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
          {reports.length === 0 && !isLoading && (
            <SimpleTableRow>
              <SimpleTableCell colSpan={6} className="text-center py-20 text-slate-400">
                <FileText className="mx-auto h-12 w-12 text-slate-100 mb-4" />
                <p className="font-medium">No intelligence reports in current queue.</p>
              </SimpleTableCell>
            </SimpleTableRow>
          )}
        </SimpleTable>
      </section>

      {/* Generate Modal */}
      <MinimalModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Synthesize New Report"
        description="Select report parameters and format to begin global ecosystem data extraction."
        onSubmit={handleGenerate}
        submitLabel="Initiate Synthesis"
        loading={isSubmitting}
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Report Label</Label>
            <Input 
              required 
              placeholder="e.g. Q1 Global Enrollment Matrix" 
              className="h-10 border-gray-300 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data Stream</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 shadow-none rounded-xl p-1">
                  <SelectItem value="enrollment" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">Enrollment Cycles</SelectItem>
                  <SelectItem value="revenue" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">Financial Velocity</SelectItem>
                  <SelectItem value="activity" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">User Engagement</SelectItem>
                  <SelectItem value="security" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">Audit Violations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Format</Label>
              <Select value={formData.format} onValueChange={(v) => setFormData({...formData, format: v})}>
                <SelectTrigger className="h-10 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 shadow-none rounded-xl p-1">
                  <SelectItem value="csv" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">CSV Spreadsheet</SelectItem>
                  <SelectItem value="pdf" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">PDF Document</SelectItem>
                  <SelectItem value="json" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">JSON Matrix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Temporal Range</Label>
            <Select value={formData.range} onValueChange={(v) => setFormData({...formData, range: v})}>
              <SelectTrigger className="h-10 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-100 shadow-none rounded-xl p-1">
                <SelectItem value="last_24h" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">Internal Last 24h</SelectItem>
                <SelectItem value="last_7_days" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">Last 7 Cycles</SelectItem>
                <SelectItem value="last_30_days" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">Last 30 Cycles</SelectItem>
                <SelectItem value="custom" className="text-slate-700 focus:bg-blue-600 focus:text-white rounded-lg py-2">Custom Range...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </MinimalModalForm>
    </div>
  )
}
