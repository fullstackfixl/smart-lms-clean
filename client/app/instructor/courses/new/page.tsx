"use client"
 
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Sparkles, Plus, BookOpen, Globe, Layout, Target, Zap, ShieldCheck } from "lucide-react"
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Label } from '../../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select'
import { toast } from "sonner"
import { API_URL } from '../../../../lib/config'
import { cn } from "../../../../lib/utils"
 
export default function CreateCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    price: "0",
    currency: "USD",
    language: "English"
  })
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
 
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
 
      if (!token) {
        toast.error('Please login first')
        router.push('/login')
        return
      }
 
      const response = await fetch(`${API_URL}/instructor/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          duration: 0,
          status: 'draft',
          isPublished: false
        })
      })
 
      const result = await response.json()
 
      if (result.success) {
        toast.success('Course initialization successful')
        router.push(`/instructor/courses/${result.data._id}`)
      } else {
        toast.error(result.message || 'Course registry failed')
      }
    } catch (error) {
      toast.error('Failed to initialize course')
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[3rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3rem] bg-white border border-slate-200/60 p-12 lg:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-indigo-50/50 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.03]">
              <Layout className="w-64 h-64 -ml-10 -mb-10 rotate-12 text-indigo-600" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-8 max-w-xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.25em] border border-indigo-100/50">
                <Plus className="w-4 h-4 ml-[-2px]" />
                Curriculum Hub Initialization
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-[-0.04em] leading-none">
                  Create New <br />
                  <span className="text-indigo-600">Course Bundle.</span>
                </h1>
                <p className="text-[17px] font-bold text-slate-500 leading-relaxed italic opacity-80">
                  Initialize a new instructional series. Define your core parameters and architectural vision for the curriculum.
                </p>
              </div>
            </div>
            
            <div className="hidden lg:block">
               <div className="h-20 w-px bg-slate-100 mx-10" />
            </div>

            <div className="flex flex-col gap-4 shrink-0">
               <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="h-16 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 border border-slate-100 hover:bg-slate-50 transition-all text-slate-400"
               >
                  <ArrowLeft className="h-4 w-4 stroke-[3]" />
                  Abandone Draft
               </Button>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Main Form Canvas ────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="bg-white rounded-[3rem] border border-slate-100 p-12 lg:p-16 shadow-sm space-y-16 relative overflow-hidden group/form">
            <div className="absolute top-0 right-0 p-12 opacity-[0.015] pointer-events-none group-hover/form:opacity-[0.03] transition-opacity duration-1000">
               <BookOpen className="w-96 h-96 text-indigo-600" />
            </div>

            <div className="space-y-12 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity & Vision</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Primary Metadata Registry</p>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <Label htmlFor="title" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bundle Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Master Systematic Web Development"
                    className="h-16 rounded-2xl bg-slate-50/50 border-slate-100 px-8 text-lg font-black text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                    required
                  />
                </div>
 
                <div className="space-y-4">
                  <Label htmlFor="description" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instructional Objective *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the knowledge transfer goals for your scholars..."
                    className="min-h-[180px] rounded-[2.5rem] bg-slate-50/50 border-slate-100 p-10 text-base font-bold text-slate-600 leading-relaxed focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-12 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Taxonomy & Level</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Structural Categorization</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <Label htmlFor="category" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Domain Category *</Label>
                  <div className="relative group/sel">
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Programming Logic"
                      className="h-16 rounded-2xl bg-slate-50/50 border-slate-100 px-8 font-black text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                      required
                    />
                    <Target className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-200 group-hover/sel:text-indigo-400 transition-colors" />
                  </div>
                </div>
 
                <div className="space-y-4">
                  <Label htmlFor="level" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Scholar Proficiency *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger className="h-16 rounded-2xl bg-slate-50/50 border-slate-100 px-8 font-black text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-2 border-slate-100 shadow-2xl">
                      <SelectItem value="beginner" className="rounded-xl py-3 font-black text-xs uppercase tracking-[0.2em] text-indigo-600">Initiate Level</SelectItem>
                      <SelectItem value="intermediate" className="rounded-xl py-3 font-black text-xs uppercase tracking-[0.2em] text-blue-600">Advanced Tier</SelectItem>
                      <SelectItem value="advanced" className="rounded-xl py-3 font-black text-xs uppercase tracking-[0.2em] text-rose-600">Master Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-12 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Valuation & Localization</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Global Distribution Specs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <Label htmlFor="price" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exchange Value (Credits)</Label>
                  <div className="relative group/sel">
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="h-16 rounded-2xl bg-slate-50/50 border-slate-100 px-8 font-black text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                    />
                    <Zap className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-200 group-hover/sel:text-amber-400 transition-colors" />
                  </div>
                </div>
 
                <div className="space-y-4">
                  <Label htmlFor="language" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Linguistic Hub</Label>
                  <div className="relative group/sel">
                     <Input
                        id="language"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        placeholder="English"
                        className="h-16 rounded-2xl bg-slate-50/50 border-slate-100 px-8 font-black text-slate-900 focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner"
                     />
                     <Globe className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-200 group-hover/sel:text-blue-400 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
            <Button
              type="submit"
              disabled={loading}
              className="h-24 px-16 bg-slate-900 text-white rounded-[2.5rem] text-[16px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-5 shadow-2xl transition-all hover:scale-105 active:scale-95 group/submit"
            >
              {loading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <>
                  Initialize Course
                  <Sparkles className="h-6 w-6 text-indigo-400 group-hover/submit:rotate-12 transition-transform" />
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm animate-pulse">
               <ShieldCheck className="w-5 h-5" />
               <p className="text-[10px] font-black uppercase tracking-widest">Registry Sync Active</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
