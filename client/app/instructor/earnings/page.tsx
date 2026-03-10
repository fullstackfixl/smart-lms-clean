"use client"

import { useState, Suspense } from "react"
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Activity, 
  Sparkles,
  Search,
  Filter,
  Download,
  Calendar,
  MousePointer2,
  Clock,
  Briefcase,
  Users,
  Wallet,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  History
} from "lucide-react"
import { cn } from "../../../lib/utils"
import { Button } from '../../../components/ui/button'
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'

function EarningsContent() {
  const [activeTab, setActiveTab] = useState("overview")
 
  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ─── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <Wallet className="w-3.5 h-3.5" />
            Financial Overview
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Earnings</h1>
          <p className="text-sm text-slate-500 font-medium italic">Manage your revenue, track transactions, and configure payouts.</p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Button
            variant="outline"
            className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            Export Data
          </Button>
          <Button
            className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-slate-900/10 transition-all hover:translate-y-[-2px]"
          >
            <CreditCard className="w-4 h-4 stroke-[3]" />
            Withdraw Funds
          </Button>
        </div>
      </div>

      {/* ─── Key Metrics ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SimpleCard className="p-8 border-slate-100 shadow-sm bg-white group hover:border-emerald-200 transition-all rounded-[2rem] hover:shadow-2xl hover:shadow-emerald-500/5">
             <div className="flex items-center justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-emerald-100 shadow-sm">
                   <DollarSign className="w-7 h-7" />
                </div>
                <SimpleBadge className="bg-emerald-50 text-emerald-600 font-black border-none px-3 py-1 text-[10px]">+12.4%</SimpleBadge>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">// Total Revenue</p>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">$42,980.00</h3>
          </SimpleCard>

          <SimpleCard className="p-8 border-slate-100 shadow-sm bg-white group hover:border-blue-200 transition-all rounded-[2rem] hover:shadow-2xl hover:shadow-blue-500/5">
             <div className="flex items-center justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-blue-100 shadow-sm">
                   <Wallet className="w-7 h-7" />
                </div>
                <SimpleBadge className="bg-blue-50 text-blue-600 font-black border-none px-3 py-1 text-[10px]">Available</SimpleBadge>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">// Wallet Balance</p>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">$8,420.50</h3>
          </SimpleCard>

          <SimpleCard className="p-8 border-slate-100 shadow-sm bg-white group hover:border-orange-200 transition-all rounded-[2rem] hover:shadow-2xl hover:shadow-orange-500/5">
             <div className="flex items-center justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-orange-100 shadow-sm">
                   <Users className="w-7 h-7" />
                </div>
                <SimpleBadge className="bg-orange-50 text-orange-600 font-black border-none px-3 py-1 text-[10px]">+8%</SimpleBadge>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">// Active Students</p>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">2,482</h3>
          </SimpleCard>

          <SimpleCard className="p-8 border-slate-100 shadow-sm bg-white group hover:border-indigo-200 transition-all rounded-[2rem] hover:shadow-2xl hover:shadow-indigo-500/5">
             <div className="flex items-center justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-indigo-100 shadow-sm">
                   <Globe className="w-7 h-7" />
                </div>
                <SimpleBadge className="bg-slate-100 text-slate-600 font-black border-none px-3 py-1 text-[10px]">100%</SimpleBadge>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">// Success Rate</p>
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">$18,500</h3>
          </SimpleCard>
      </div>

      {/* ─── Main Content Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* History / Transactions */}
          <div className="lg:col-span-8">
             <SimpleCard className="p-0 border-slate-100 shadow-sm bg-white overflow-hidden min-h-[500px] rounded-[2.5rem]">
                <div className="p-10 flex items-center justify-between border-b border-slate-50">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Recent Transactions</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic opacity-70">// Your latest revenue activity</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50">
                         All Time
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 text-slate-400">
                         <Filter className="w-4 h-4" />
                      </Button>
                   </div>
                </div>

                <FlatTable>
                   <FlatTableHead>
                      <FlatTableRow className="bg-slate-50/50">
                         <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 pl-10">Transaction</FlatTableCell>
                         <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Date</FlatTableCell>
                         <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Amount</FlatTableCell>
                         <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 text-right pr-10">Status</FlatTableCell>
                      </FlatTableRow>
                   </FlatTableHead>
                   <tbody>
                      {[
                        { id: 1, type: 'Course Sale', date: 'Oct 12, 2023', amount: '+$149.00', status: 'Completed', course: 'Machine Learning A-Z' },
                        { id: 2, type: 'Withdrawal', date: 'Oct 10, 2023', amount: '-$500.00', status: 'Pending', course: 'Payout to Bank' },
                        { id: 3, type: 'Course Sale', date: 'Oct 08, 2023', amount: '+$99.00', status: 'Completed', course: 'React Masterclass' },
                        { id: 4, type: 'Course Sale', date: 'Oct 05, 2023', amount: '+$199.00', status: 'Completed', course: 'Next.js 14 Guide' },
                        { id: 5, type: 'Refund', date: 'Oct 02, 2023', amount: '-$149.00', status: 'Refunded', course: 'Advanced Python' },
                      ].map((tx) => (
                        <FlatTableRow key={tx.id} className="group cursor-default transition-all">
                           <FlatTableCell className="pl-10 py-8">
                              <div className="flex items-center gap-5">
                                 <div className={cn(
                                   "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border",
                                   tx.amount.startsWith('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                 )}>
                                    {tx.amount.startsWith('+') ? <ArrowUpRight className="w-5 h-5 stroke-[3]" /> : <ArrowDownRight className="w-5 h-5 stroke-[3]" />}
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">{tx.type}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate max-w-[200px]">{tx.course}</p>
                                 </div>
                              </div>
                           </FlatTableCell>
                           <FlatTableCell>
                              <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                                 <Clock className="w-3.5 h-3.5" />
                                 {tx.date}
                              </div>
                           </FlatTableCell>
                           <FlatTableCell className={cn(
                             "text-lg font-black tabular-nums tracking-tight",
                             tx.amount.startsWith('+') ? "text-emerald-600" : "text-slate-900"
                           )}>
                              {tx.amount}
                           </FlatTableCell>
                           <FlatTableCell className="text-right pr-10">
                              <SimpleBadge className={cn(
                                "font-black uppercase text-[9px] tracking-widest px-4 py-1.5 border-none",
                                tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                                tx.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                              )}>
                                 {tx.status}
                              </SimpleBadge>
                           </FlatTableCell>
                        </FlatTableRow>
                      ))}
                   </tbody>
                </FlatTable>
                
                <div className="p-10 text-center bg-slate-50/50 border-t border-slate-50 mt-auto">
                   <Button variant="ghost" className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 gap-2 hover:bg-white transition-all">
                      View Transaction History
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                   </Button>
                </div>
             </SimpleCard>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-8">
             <SimpleCard className="bg-slate-950 border-none p-10 relative overflow-hidden group shadow-2xl rounded-[2.5rem]">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000" />
                <div className="relative z-10 space-y-10">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                         <CreditCard className="h-6 w-6 text-emerald-400 stroke-[2.5]" />
                      </div>
                      <h4 className="text-xl font-black text-white tracking-tight uppercase tracking-[0.1em]">Payout Account</h4>
                   </div>
                   
                   <div className="space-y-5">
                      <div className="p-8 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05] backdrop-blur-md hover:bg-white/[0.05] transition-all">
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 leading-none">Primary Method</p>
                         <p className="text-lg text-white font-black leading-tight mb-2">Standard Bank Transfer</p>
                         <p className="text-[11px] text-white/40 font-bold tracking-widest">**** 4291 | VERIFIED</p>
                      </div>
                      <div className="p-8 rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05]">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 leading-none">Account Security</p>
                         <div className="flex items-center gap-4">
                            <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                               <div className="h-full w-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            </div>
                            <span className="text-[11px] font-black text-emerald-400">100%</span>
                         </div>
                      </div>
                   </div>

                   <Button className="w-full h-16 bg-white text-slate-950 hover:bg-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] gap-2 shadow-xl border-none">
                      Manage Payouts
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                   </Button>
                </div>
             </SimpleCard>

             <SimpleCard className="p-10 border-slate-100 shadow-sm bg-white space-y-10 rounded-[2.5rem]">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic opacity-60 ml-1">// Growth Strategy</p>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Revenue Insights</h3>
                </div>

                <div className="space-y-8">
                   <div className="flex gap-5 group/item cursor-default">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all duration-500 shadow-sm shrink-0 border border-blue-100">
                         <Zap className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[15px] font-black text-slate-900 leading-none">Conversion Optmization</p>
                         <p className="text-[12px] text-slate-400 font-medium leading-relaxed italic pr-4">Enhanced assessments can lead to higher student engagement.</p>
                      </div>
                   </div>

                   <div className="flex gap-5 group/item cursor-default">
                      <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover/item:bg-orange-600 group-hover/item:text-white transition-all duration-500 shadow-sm shrink-0 border border-orange-100">
                         <Activity className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[15px] font-black text-slate-900 leading-none">Retention Analytics</p>
                         <p className="text-[12px] text-slate-400 font-medium leading-relaxed italic pr-4">Student activity levels remain consistent across all modules.</p>
                      </div>
                   </div>

                   <div className="flex gap-5 group/item cursor-default">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all duration-500 shadow-sm shrink-0 border border-indigo-100">
                         <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[15px] font-black text-slate-900 leading-none">Value Creation</p>
                         <p className="text-[12px] text-slate-400 font-medium leading-relaxed italic pr-4">Financial performance has seen steady growth this quarter.</p>
                      </div>
                   </div>
                </div>
             </SimpleCard>
          </div>
      </div>
    </div>
  )
}

export default function InstructorEarningsPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-14 w-14 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse italic">Loading Earnings Data...</p>
       </div>
    }>
       <EarningsContent />
    </Suspense>
  )
}
