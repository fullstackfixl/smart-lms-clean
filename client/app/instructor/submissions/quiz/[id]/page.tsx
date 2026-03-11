"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    User,
    Calendar,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Award,
    Loader2
} from "lucide-react"
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card'
import { Badge } from '../../../../../components/ui/badge'
import { Progress } from '../../../../../components/ui/progress'
import { toast } from "sonner"
import { cn } from "../../../../../lib/utils"
import { useAuth } from '../../../../../lib/auth-context'
import { instructorApi } from '../../../../../lib/api'


interface DetailedAnswer {
    questionIndex: number
    selectedOption: number
    isCorrect: boolean
    questionText: string
    options: string[]
    correctAnswer: number
    explanation?: string
}

interface SubmissionDetail {
    _id: string
    studentId: {
        name: string
        email: string
        profile?: { avatar?: string }
    }
    quizId: {
        title: string
        pass_percentage: number
    }
    courseId: {
        title: string
    }
    score: number
    totalMarks: number
    percentage: number
    attemptNumber: number
    passed: boolean
    submittedAt: string
    answers: DetailedAnswer[]
}

export default function InstructorQuizReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()
    const submissionId = unwrappedParams.id

    const { token } = useAuth()

    const [loading, setLoading] = useState(true)
    const [submission, setSubmission] = useState<SubmissionDetail | null>(null)

    useEffect(() => {
        fetchSubmissionDetail()
    }, [submissionId])

    const fetchSubmissionDetail = async () => {
        setLoading(true)
        try {
            if (!token) {
                router.push('/login')
                return
            }

            const res = await instructorApi.getQuizSubmissionById(token, submissionId)
            if (res.success) {
                const payload: any = res.data
                setSubmission(payload?.submission || payload)
            } else {
                toast.error(res.error || 'Failed to load submission details')
                router.push('/instructor/submissions')
            }
        } catch (error) {
            toast.error('Error loading submission review')
            router.back()
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
                <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Generating Analysis Report...</p>
            </div>
        )
    }

    if (!submission) return null

    return (
        <div className="min-h-screen bg-slate-50/30 p-4 md:p-12 pb-32">
            <div className="max-w-5xl mx-auto space-y-12">
                <Button 
                  variant="ghost" 
                  onClick={() => router.back()} 
                  className="rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all gap-3"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Submissions
                </Button>

                {/* Overview Header */}
                <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="p-10 pb-0">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                                       Assessment Details
                                    </div>
                                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tight">{submission.quizId.title}</CardTitle>
                                    <CardDescription className="text-sm font-medium italic text-slate-400">Course Bundle: {submission.courseId.title}</CardDescription>
                                </div>
                                <div className={cn(
                                   "px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                   submission.passed ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                    {submission.passed ? "PASSED" : "FAILED"}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 pt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-8 py-8 border-t border-b border-slate-50 mb-10">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner overflow-hidden">
                                        {submission.studentId.profile?.avatar ? (
                                            <img src={submission.studentId.profile.avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="text-xl font-black text-indigo-400">{submission.studentId.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900 leading-tight">{submission.studentId.name}</p>
                                        <p className="text-[11px] font-bold text-slate-400 lowercase tracking-tight">{submission.studentId.email}</p>
                                    </div>
                                </div>
                                <div className="h-12 w-px bg-slate-100 hidden sm:block" />
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" /> Date Submitted
                                    </p>
                                    <p className="text-sm font-black text-slate-900 tracking-tight">{new Date(submission.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <DetailCard label="Raw Score" value={`${submission.score}/${submission.totalMarks}`} />
                                <DetailCard label="Mastery" value={`${submission.percentage}%`} highlight />
                                <DetailCard label="Attempt" value={`#${submission.attemptNumber}`} />
                                <DetailCard label="Required" value={`${submission.quizId.pass_percentage}%`} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col items-center justify-center text-center p-12 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                           <Award className="h-40 w-40" />
                        </div>
                        <Award className="h-20 w-20 mb-8 text-indigo-400 relative z-10" />
                        <h3 className="text-5xl font-black mb-2 tracking-tighter tabular-nums relative z-10">{submission.percentage}%</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 relative z-10">Grade Assessment</p>
                        <div className="w-full bg-white/10 rounded-full h-3 mb-8 shadow-inner relative z-10 overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000", submission.passed ? "bg-emerald-500" : "bg-rose-500")}
                                style={{ width: `${submission.percentage}%` }}
                            />
                        </div>
                        <p className="text-xs font-bold italic text-slate-300 relative z-10">
                           {submission.passed ? 'Scholar has met the academic threshold.' : 'Scholar has not met the academic threshold.'}
                        </p>
                    </Card>
                </div>

                {/* Detailed Question Review */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <HelpCircle className="h-6 w-6 text-indigo-600" /> Question Analysis
                    </h2>

                    <div className="grid grid-cols-1 gap-10">
                        {submission.answers.map((answer, idx) => (
                            <div key={idx} className={cn(
                               "bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all group/q hover:shadow-xl hover:shadow-indigo-500/5",
                               answer.isCorrect ? "hover:border-emerald-200" : "hover:border-rose-200"
                            )}>
                                <div className="p-10 space-y-8">
                                    <div className="flex items-start gap-6">
                                        <span className={cn(
                                          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black transition-transform group-hover/q:scale-110 shadow-lg",
                                          answer.isCorrect ? "bg-emerald-600 text-white shadow-emerald-500/20" : "bg-rose-600 text-white shadow-rose-500/20"
                                        )}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex-grow min-w-0 pr-8">
                                            <p className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover/q:text-indigo-600 transition-colors uppercase">{answer.questionText}</p>
                                        </div>
                                        {answer.isCorrect ? (
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-8 w-8 text-rose-500 flex-shrink-0" />
                                        )}
                                    </div>

                                    <div className="grid gap-4 pl-16">
                                        {answer.options.map((opt, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className={cn(
                                                   "p-6 rounded-2xl text-[13px] font-black uppercase tracking-wider border flex justify-between items-center transition-all",
                                                   optIdx === answer.correctAnswer
                                                        ? "bg-emerald-50 border-emerald-100 text-emerald-800 shadow-sm"
                                                        : optIdx === answer.selectedOption && !answer.isCorrect
                                                            ? "bg-rose-50 border-rose-100 text-rose-800 shadow-sm"
                                                            : "bg-slate-50 border-slate-100 text-slate-400 group-hover/q:bg-white transition-colors"
                                                )}
                                            >
                                                <span>{opt}</span>
                                                <div className="flex gap-3">
                                                    {optIdx === answer.correctAnswer && (
                                                       <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] border border-emerald-200 uppercase tracking-widest font-black">Correct Key</div>
                                                    )}
                                                    {optIdx === answer.selectedOption && (
                                                       <div className={cn(
                                                          "px-3 py-1 rounded-full text-[9px] border uppercase tracking-widest font-black",
                                                          answer.isCorrect ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"
                                                       )}>
                                                          Learner Pick
                                                       </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {answer.explanation && (
                                        <div className="ml-16 mt-4 p-8 bg-slate-50/80 rounded-[1.5rem] border border-slate-100 flex items-start gap-4 group-hover/q:bg-indigo-50/50 group-hover/q:border-indigo-100 transition-colors">
                                            <Progress className="hidden" /> {/* Mock progress for some space if needed */}
                                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                               <Clock className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                               <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400">Review Analysis</p>
                                               <p className="text-sm text-slate-600 font-bold leading-relaxed">{answer.explanation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DetailCard({ label, value, highlight }: { label: string, value: string | number, highlight?: boolean }) {
   return (
      <div className={cn(
         "p-6 rounded-2xl flex flex-col items-center justify-center text-center border transition-all",
         highlight ? "bg-indigo-50 border-indigo-100 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-900"
      )}>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
         <p className="text-2xl font-black tabular-nums">{value}</p>
      </div>
   )
}
