"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileQuestion, Search, Clock, CheckCircle2, Trophy, Loader2, Play,
  RotateCcw, XCircle, Star, Filter, ChevronRight, Send, ChevronLeft, Zap,
  ArrowLeft, Timer, AlertCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from '../../../lib/auth-context'
import { collegeApi } from '../../../lib/api'
import { API_URL } from '../../../lib/config'
import { cn } from "../../../lib/utils"
import { Button } from '../../../components/ui/button'

interface Quiz {
  _id: string; title: string; description: string
  total_marks: number; max_attempts: number; timer_minutes: number | null
  pass_percentage: number; questions_count: number
  questions: { question: string; options: string[] }[]
  created_at: string; attemptsCount: number; attemptsLeft: number
  bestScore: number | null; bestPercentage: number | null; hasPassed: boolean
  course: { _id: string; title: string; thumbnail?: string } | null
  instructor: { _id: string; name: string } | null
  subjectName?: string
  subjectCode?: string
}

const getToken = () => typeof window !== "undefined"
  ? window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token') : null

export default function QuizzesPage() {
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const router = useRouter()
  const { user, token } = useAuth()

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  useEffect(() => { loadQuizzes() }, [token])

  const loadQuizzes = async () => {
    if (!token) { router.push('/login'); return }
    setLoading(true)
    try {
      if (isCollege) {
        const res = await collegeApi.getStudentQuizzes(token)
        if (res.success) {
          const payload: any = res.data || {}
          setQuizzes(payload.quizzes || [])
        } else {
          toast.error(res.error || "Failed to load quizzes")
        }
      } else {
        const res = await fetch(`${API_URL}/api/quizzes/student`, {
          headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include'
        })
        const data = await res.json()
        if (data.success) setQuizzes(data.data || [])
        else toast.error(data.message || "Failed to load quizzes")
      }
    } catch { toast.error("Connection error") }
    finally { setLoading(false) }
  }

  const filtered = quizzes.filter(q => {
    const matchText = q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.course?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.subjectName || '').toLowerCase().includes(search.toLowerCase())
    if (filter === 'passed') return matchText && q.hasPassed
    if (filter === 'pending') return matchText && !q.hasPassed && q.attemptsLeft > 0
    if (filter === 'locked') return matchText && !q.hasPassed && q.attemptsLeft === 0
    return matchText
  })

  const stats = {
    total: quizzes.length,
    passed: quizzes.filter(q => q.hasPassed).length,
    pending: quizzes.filter(q => !q.hasPassed && q.attemptsLeft > 0).length,
  }

  if (activeQuiz) return <InlineQuizPlayer quiz={activeQuiz} onBack={() => { setActiveQuiz(null); loadQuizzes() }} />

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50">
      <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-1">
        <FileQuestion className="h-8 w-8 text-blue-600 animate-pulse" />
      </div>
      <p className="text-gray-600 text-sm font-medium">Loading quizzes...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              My Quizzes
            </h1>
            <p className="text-gray-600 mt-1">Test your knowledge and track your progress</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 h-11 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Stats Cards */}
        {quizzes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileQuestion className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Quizzes</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.passed}</p>
                  <p className="text-sm text-gray-500">Passed</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { v: 'all', l: 'All', c: 'bg-blue-600' },
            { v: 'pending', l: 'Pending', c: 'bg-orange-500' },
            { v: 'passed', l: 'Passed', c: 'bg-green-500' },
            { v: 'locked', l: 'No Attempts', c: 'bg-red-500' },
          ].map(tab => (
            <button
              key={tab.v}
              onClick={() => setFilter(tab.v)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                filter === tab.v
                  ? `${tab.c} text-white shadow-md`
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {tab.l}
            </button>
          ))}
        </div>

        {/* Quiz Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <FileQuestion className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">{search ? `No quizzes match "${search}"` : "No quizzes available yet."}</p>
            <p className="text-gray-400 mt-2">Check back later for new quizzes from your instructors</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.map(quiz => (
              <motion.div
                key={quiz._id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } } }}
              >
                <div className="group flex flex-col h-full rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                  {/* Status strip */}
                  <div className={cn(
                    "h-1.5 w-full",
                    quiz.hasPassed ? 'bg-green-500' : quiz.attemptsLeft === 0 ? 'bg-red-500' : 'bg-blue-500'
                  )} />

                  <div className="p-6 flex-1 flex flex-col gap-4">
                    {/* Title & icon */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {isCollege && quiz.subjectName && (
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{quiz.subjectName} {quiz.subjectCode && `(${quiz.subjectCode})`}</p>
                        )}
                        {!isCollege && quiz.course && (
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">{quiz.course.title}</p>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{quiz.title}</h3>
                      </div>
                      <div className={cn(
                        "shrink-0 h-12 w-12 rounded-xl flex items-center justify-center",
                        quiz.hasPassed ? 'bg-green-100' : quiz.attemptsLeft === 0 ? 'bg-red-100' : 'bg-blue-100'
                      )}>
                        {quiz.hasPassed ? <Trophy className="h-6 w-6 text-green-600" /> : quiz.attemptsLeft === 0 ? <XCircle className="h-6 w-6 text-red-500" /> : <FileQuestion className="h-6 w-6 text-blue-600" />}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {quiz.hasPassed
                        ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" /> PASSED
                          </span>
                        : quiz.attemptsLeft === 0
                          ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
                              <AlertCircle className="h-3.5 w-3.5" /> NO ATTEMPTS LEFT
                            </span>
                          : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                              <Clock className="h-3.5 w-3.5" /> {quiz.attemptsLeft} attempt{quiz.attemptsLeft !== 1 ? 's' : ''} left
                            </span>
                      }
                    </div>

                    {/* Stats mini grid */}
                    <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4">
                      {[
                        { l: 'Questions', v: quiz.questions_count },
                        { l: 'Time', v: quiz.timer_minutes ? `${quiz.timer_minutes}m` : '∞' },
                        { l: 'Pass', v: `${quiz.pass_percentage}%` },
                      ].map((s, i) => (
                        <div key={i} className={cn("text-center", i === 1 ? 'border-x border-gray-200' : '')}>
                          <p className="text-xs text-gray-500 mb-1">{s.l}</p>
                          <p className="text-lg font-bold text-gray-900">{s.v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Best score bar */}
                    {quiz.attemptsCount > 0 && quiz.bestPercentage !== null && (
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> Best Score
                          </span>
                          <span className={cn("font-bold", quiz.hasPassed ? 'text-green-600' : 'text-gray-700')}>{quiz.bestPercentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", quiz.hasPassed ? 'bg-green-500' : 'bg-gray-500')} style={{ width: `${quiz.bestPercentage}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => setActiveQuiz(quiz)}
                      disabled={!quiz.hasPassed && quiz.attemptsLeft === 0}
                      className={cn(
                        "w-full h-12 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                        quiz.hasPassed
                          ? 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                          : quiz.attemptsLeft === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      )}
                    >
                      {quiz.hasPassed ? <><RotateCcw className="h-4 w-4" /> Retake</> : quiz.attemptsCount > 0 ? <><Play className="h-4 w-4" /> Try Again</> : <><Play className="h-4 w-4" /> Start Quiz</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── Inline Quiz Player ────────────────────────────────────────────────────────
function InlineQuizPlayer({ quiz, onBack }: { quiz: Quiz; onBack: () => void }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1))
  const [timeLeft, setTimeLeft] = useState(quiz.timer_minutes ? quiz.timer_minutes * 60 : null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [startedAt] = useState(new Date().toISOString())

  useEffect(() => {
    if (!timeLeft || result) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const t = setInterval(() => setTimeLeft(p => p !== null ? p - 1 : null), 1000)
    return () => clearInterval(t)
  }, [timeLeft, result])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const q = quiz.questions[currentQ]
  const answered = answers.filter(a => a !== -1).length

  const handleSubmit = async () => {
    if (submitting || result) return
    setSubmitting(true)
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/api/quizzes/${quiz._id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          answers: answers.map((sel, idx) => ({ question_index: idx, selected_option: sel === -1 ? 0 : sel, time_spent_seconds: 0 })),
          started_at: startedAt
        })
      })
      const data = await res.json()
      if (data.success) { setResult(data.data); toast.success('Quiz submitted!') }
      else toast.error(data.message || 'Submission failed')
    } catch { toast.error('Submission failed') }
    finally { setSubmitting(false) }
  }

  if (result) return (
    (() => {
      const attempt = result?.attempt || result?.attempt_info || null
      const detailed = result?.detailed_results || result?.detailedResults || null
      const percent = attempt?.percentage ?? result?.percentage ?? 0
      const passed = attempt?.passed ?? result?.passed ?? false
      const correct = attempt?.score ?? detailed?.attempt_info?.score ?? null
      const total = attempt?.total_questions ?? detailed?.attempt_info?.total_questions ?? quiz.questions.length
      const wrong = correct !== null ? Math.max(0, total - correct) : null

      return (
    <div className="min-h-screen bg-gray-50 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto">
        <div className={cn(
          "rounded-2xl p-8 text-center border-2",
          passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        )}>
          {passed ? <Trophy className="h-16 w-16 text-green-600 mx-auto mb-4" /> : <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{passed ? '🎉 Congratulations! You Passed!' : 'Quiz Complete'}</h2>
          <p className={cn("text-5xl font-black my-6", passed ? 'text-green-600' : 'text-red-500')}>
            {Math.round(percent)}%
          </p>
          <p className="text-gray-600 mb-2">Your Score</p>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-700">
            <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
              Correct: <span className="font-semibold text-green-700">{correct ?? '—'}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
              Wrong: <span className="font-semibold text-red-700">{wrong ?? '—'}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white border border-gray-200">
              Total: <span className="font-semibold">{total}</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">Need {quiz.pass_percentage}% to pass</p>
          <button onClick={onBack} className="mt-8 px-8 py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors shadow-lg">
            Back to Quizzes
          </button>
        </div>
      </motion.div>
    </div>
      )
    })()
  )

  const isLow = (timeLeft || 0) < 60

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between rounded-xl px-6 py-4 border border-gray-200 bg-white shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h2 className="font-bold text-gray-900">{quiz.title}</h2>
              {quiz.course && <p className="text-xs text-gray-500">{quiz.course.title}</p>}
            </div>
          </div>
          {timeLeft !== null && (
            <motion.div
              animate={isLow ? { scale: [1, 1.04, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={cn(
                "px-4 py-2 rounded-xl font-mono font-bold text-sm flex items-center gap-2 border",
                isLow ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
              )}
            >
              <Timer className="h-4 w-4" /> {fmt(timeLeft)}
            </motion.div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{answered}/{quiz.questions.length} answered</span>
            <span>{Math.round((answered / quiz.questions.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-600 rounded-full" 
              animate={{ width: `${(answered / quiz.questions.length) * 100}%` }} 
              transition={{ duration: 0.3 }} 
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navigator */}
          <div className="hidden lg:block">
            <div className="rounded-xl p-4 border border-gray-200 bg-white shadow-sm sticky top-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Question Navigator</p>
              <div className="grid grid-cols-5 gap-2">
                {quiz.questions.map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentQ(idx)}
                    className={cn(
                      "h-10 w-10 rounded-lg text-sm font-bold transition-all",
                      currentQ === idx 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : answers[idx] !== -1 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                    )}>
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-blue-600" />
                  <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                  <span className="text-gray-600">Not answered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div key={currentQ} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.16 }}>
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-3 py-1 rounded-full mb-3">
                      Question {currentQ + 1} of {quiz.questions.length}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">{q.question}</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {q.options.map((opt, oi) => (
                      <motion.button 
                        key={oi} 
                        whileTap={{ scale: 0.99 }}
                        onClick={() => { const next = [...answers]; next[currentQ] = oi; setAnswers(next) }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                          answers[currentQ] === oi 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        )}>
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all",
                          answers[currentQ] === oi ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                        )}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <span className="text-gray-900 font-medium">{opt}</span>
                        {answers[currentQ] === oi && <CheckCircle2 className="h-5 w-5 text-blue-600 ml-auto shrink-0" />}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center rounded-xl px-4 py-3 border border-gray-200 bg-white shadow-sm">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQ(p => p - 1)} 
                disabled={currentQ === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-gray-600 font-medium">{currentQ + 1} / {quiz.questions.length}</span>
              {currentQ === quiz.questions.length - 1
                ? <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                    {answered < quiz.questions.length ? `${quiz.questions.length - answered} remaining` : 'Submit Quiz'}
                  </Button>
                : <Button 
                    onClick={() => setCurrentQ(p => p + 1)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
              }
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
