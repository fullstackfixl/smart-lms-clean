"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Clock, ChevronRight, ChevronLeft, Send, AlertCircle,
    CheckCircle2, XCircle, Trophy, ArrowLeft, Loader2, Zap
} from "lucide-react"
import { toast } from "sonner"
import { API_URL } from '../../../../lib/config'

interface Question { question: string; options: string[] }
interface QuizData {
    _id: string; title: string; description: string
    timer_minutes: number; totalMarks: number; questions: Question[]; attemptNumber: number
}
interface ResultData {
    score: number; totalMarks: number; percentage: number; passed: boolean; attemptNumber: number
    results: { questionIndex: number; selectedOption: number; isCorrect: boolean; explanation: string; correctAnswer: number }[]
}

const getToken = () => typeof window !== "undefined"
    ? window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token') : null

export default function QuizAttemptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: quizId } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [quiz, setQuiz] = useState<QuizData | null>(null)
    const [currentIdx, setCurrentIdx] = useState(0)
    const [answers, setAnswers] = useState<number[]>([])
    const [timeLeft, setTimeLeft] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<ResultData | null>(null)

    useEffect(() => { fetchQuiz() }, [quizId])

    useEffect(() => {
        if (timeLeft > 0 && !result && !isSubmitting) {
            const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { clearInterval(t); handleSubmit(); return 0 } return p - 1 }), 1000)
            return () => clearInterval(t)
        }
    }, [timeLeft, result, isSubmitting])

    const fetchQuiz = async () => {
        setLoading(true)
        try {
            const token = getToken()
            if (!token) { router.push('/login'); return }
            const res = await fetch(`${API_URL}/student/quiz/${quizId}/start`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                credentials: 'include'
            })
            const data = await res.json()
            if (data.success) {
                setQuiz(data.data.quiz)
                setAnswers(new Array(data.data.quiz.questions.length).fill(-1))
                setTimeLeft(data.data.quiz.timer_minutes * 60)
            } else {
                toast.error(data.message || 'Failed to start quiz')
                router.push('/student/quizzes')
            }
        } catch { toast.error('Failed to load quiz'); router.back() }
        finally { setLoading(false) }
    }

    const handleSelectOption = (idx: number) => {
        if (result) return
        const updated = [...answers]; updated[currentIdx] = idx; setAnswers(updated)
    }

    const handleSubmit = async () => {
        if (isSubmitting || result) return
        setIsSubmitting(true)
        try {
            const token = getToken()
            const res = await fetch(`${API_URL}/student/quiz/${quizId}/submit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }), credentials: 'include'
            })
            const data = await res.json()
            if (data.success) { setResult(data.data.submission); toast.success('Quiz submitted!') }
            else toast.error(data.message || 'Failed to submit quiz')
        } catch { toast.error('Submission failed.') }
        finally { setIsSubmitting(false) }
    }

    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading quiz...</p>
            </div>
        </div>
    )

    if (!quiz) return null

    // ─── Results Screen ──────────────────────────────────────────────────────────
    if (result) {
        const pct = result.percentage
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl p-8 text-center relative overflow-hidden"
                    style={{
                        background: result.passed
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(20,184,166,0.08) 100%)'
                            : 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(220,38,38,0.06) 100%)',
                        border: `1px solid ${result.passed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`
                    }}
                >
                    <div className="absolute top-0 right-0 h-32 w-32 rounded-full opacity-5 blur-2xl" style={{ background: result.passed ? '#10b981' : '#ef4444' }} />
                    {result.passed
                        ? <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
                        : <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    }
                    <h1 className="text-3xl font-black text-white mb-2">{result.passed ? '🎉 Passed!' : 'Quiz Complete'}</h1>
                    <p className="text-slate-400 mb-6">Attempt #{result.attemptNumber}</p>

                    {/* Circular progress */}
                    <div className="relative mx-auto h-32 w-32 mb-6">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                            <motion.circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={result.passed ? '#10b981' : '#ef4444'}
                                strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - pct / 100) }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white">{pct}%</span>
                            <span className="text-[10px] text-slate-500 font-medium">Score</span>
                        </div>
                    </div>

                    <p className="text-lg font-bold text-slate-200">{result.score} / {result.totalMarks} marks</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
                        style={{ background: result.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)', color: result.passed ? '#34d399' : '#f87171' }}>
                        {result.passed ? '✓ PASSED' : '✗ FAILED'}
                    </div>

                    <div className="mt-6">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mx-auto">
                            <ArrowLeft className="h-4 w-4" /> Back to Course
                        </button>
                    </div>
                </motion.div>

                {/* Review Answers */}
                <div>
                    <h2 className="text-base font-bold text-slate-100 mb-4">Review Your Answers</h2>
                    <div className="space-y-4">
                        {result.results.map((qr, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="rounded-2xl border p-5"
                                style={{
                                    background: qr.isCorrect ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                                    borderColor: qr.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.18)'
                                }}
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    {qr.isCorrect
                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                                        : <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                    }
                                    <p className="text-sm font-semibold text-slate-200 leading-snug">
                                        Q{idx + 1}. {quiz.questions[idx].question}
                                    </p>
                                </div>
                                <div className="space-y-2 pl-8">
                                    {quiz.questions[idx].options.map((opt, oi) => {
                                        const isCorrect = oi === qr.correctAnswer
                                        const isSelected = oi === qr.selectedOption
                                        const isWrong = isSelected && !isCorrect
                                        return (
                                            <div key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-all ${isCorrect ? 'bg-emerald-500/12 text-emerald-300' : isWrong ? 'bg-red-500/10 text-red-300' : 'text-slate-500'}`}>
                                                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'bg-white/5'}`}>
                                                    {String.fromCharCode(65 + oi)}
                                                </div>
                                                <span>{opt}</span>
                                                {isCorrect && <span className="ml-auto text-[10px] font-bold text-emerald-400 shrink-0">CORRECT</span>}
                                                {isWrong && <span className="ml-auto text-[10px] font-bold text-red-400 shrink-0">YOUR ANSWER</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                                {qr.explanation && (
                                    <div className="mt-3 ml-8 p-3 rounded-lg text-xs text-slate-400 italic bg-white/3 border border-white/5">
                                        <span className="font-bold not-italic text-slate-300 mr-1">Explanation:</span>{qr.explanation}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // ─── Quiz Taking Screen ───────────────────────────────────────────────────────
    const currentQ = quiz.questions[currentIdx]
    const answeredCount = answers.filter(a => a !== -1).length
    const progress = (answeredCount / quiz.questions.length) * 100
    const isLow = timeLeft < 60

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between rounded-2xl px-5 py-4 border border-white/6" style={{ background: 'rgba(15,20,40,0.7)' }}>
                <div>
                    <h1 className="text-base font-bold text-white truncate max-w-xs">{quiz.title}</h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">Attempt #{quiz.attemptNumber} · {quiz.questions.length} Questions</p>
                </div>
                <motion.div
                    animate={isLow ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-base font-bold ${isLow ? 'bg-red-500/15 text-red-400 border border-red-500/25' : 'bg-white/6 text-white border border-white/8'}`}
                >
                    <Clock className={`h-4 w-4 ${isLow ? 'text-red-400' : 'text-emerald-400'}`} />
                    {fmt(timeLeft)}
                </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span>{answeredCount}/{quiz.questions.length} answered</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-5">
                {/* Question Navigator */}
                <div className="hidden md:block">
                    <div className="rounded-2xl p-4 border border-white/6 sticky top-4" style={{ background: 'rgba(15,20,40,0.7)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-3">NAVIGATOR</p>
                        <div className="grid grid-cols-4 gap-1.5">
                            {quiz.questions.map((_, idx) => {
                                const isAnswered = answers[idx] !== -1
                                const isCurrent = idx === currentIdx
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIdx(idx)}
                                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${isCurrent ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : isAnswered ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-white/4 text-slate-500 border border-white/5 hover:bg-white/8'}`}
                                    >
                                        {idx + 1}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="mt-4 space-y-1.5 text-[10px]">
                            <div className="flex items-center gap-2 text-slate-500">
                                <div className="h-3 w-3 rounded bg-emerald-500" /> Answered
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <div className="h-3 w-3 rounded bg-white/8 border border-white/10" /> Unanswered
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="md:col-span-3 space-y-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIdx}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.18 }}
                        >
                            <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: 'rgba(15,20,40,0.7)' }}>
                                <div className="px-6 pt-6 pb-4 border-b border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/12 rounded-full px-3 py-1">
                                            Q {currentIdx + 1} of {quiz.questions.length}
                                        </span>
                                    </div>
                                    <h2 className="text-base font-semibold text-white leading-relaxed">{currentQ.question}</h2>
                                </div>
                                <div className="p-5 space-y-2.5">
                                    {currentQ.options.map((opt, oi) => {
                                        const isSelected = answers[currentIdx] === oi
                                        return (
                                            <motion.button
                                                key={oi}
                                                whileHover={{ x: 2 }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleSelectOption(oi)}
                                                className={`group w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isSelected
                                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-sm shadow-emerald-500/10'
                                                    : 'border-white/6 bg-white/3 text-slate-300 hover:bg-white/6 hover:border-white/12 hover:text-white'
                                                    }`}
                                            >
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold shrink-0 transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-white/6 text-slate-400 group-hover:bg-white/12'}`}>
                                                    {String.fromCharCode(65 + oi)}
                                                </div>
                                                <span className="text-sm font-medium flex-1">{opt}</span>
                                                {isSelected && <Zap className="h-4 w-4 text-emerald-400 shrink-0" />}
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between rounded-xl px-4 py-3 border border-white/6" style={{ background: 'rgba(15,20,40,0.7)' }}>
                        <button
                            onClick={() => setCurrentIdx(p => p - 1)}
                            disabled={currentIdx === 0}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg hover:bg-white/4"
                        >
                            <ChevronLeft className="h-4 w-4" /> Prev
                        </button>

                        <span className="text-xs text-slate-600">{currentIdx + 1} / {quiz.questions.length}</span>

                        {currentIdx === quiz.questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {answers.includes(-1) ? `${quiz.questions.length - answeredCount} Remaining` : 'Submit Quiz'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentIdx(p => p + 1)}
                                className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/4"
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
