"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileQuestion, Search, Clock, CheckCircle2, Trophy, Loader2, Play,
  RotateCcw, XCircle, Star, Filter, ChevronRight, Send, ChevronLeft, Zap
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'

interface Quiz {
  _id: string; title: string; description: string
  total_marks: number; max_attempts: number; timer_minutes: number | null
  pass_percentage: number; questions_count: number
  questions: { question: string; options: string[] }[]
  created_at: string; attemptsCount: number; attemptsLeft: number
  bestScore: number | null; bestPercentage: number | null; hasPassed: boolean
  course: { _id: string; title: string; thumbnail?: string } | null
  instructor: { _id: string; name: string } | null
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

  useEffect(() => { loadQuizzes() }, [])

  const loadQuizzes = async () => {
    setLoading(true)
    try {
      const token = getToken()
      if (!token) { router.push('/login'); return }
      const res = await fetch(`${API_URL}/api/quizzes/student`, {
        headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include'
      })
      const data = await res.json()
      if (data.success) setQuizzes(data.data || [])
      else toast.error(data.message || "Failed to load quizzes")
    } catch { toast.error("Connection error") }
    finally { setLoading(false) }
  }

  const filtered = quizzes.filter(q => {
    const matchText = q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.course?.title || '').toLowerCase().includes(search.toLowerCase())
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-1">
        <FileQuestion className="h-7 w-7 text-emerald-400 animate-pulse" />
      </div>
      <p className="text-slate-500 text-sm font-medium">Loading quizzes...</p>
    </div>
  )

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            My <span className="text-emerald-400">Quizzes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Test your knowledge and track your progress</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 h-10 rounded-xl bg-white/4 border border-white/8 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/30"
          />
        </div>
      </div>

      {/* Stats */}
      {quizzes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: stats.total, color: "from-violet-500/12 to-purple-500/6", fg: "text-violet-300", icon: FileQuestion },
            { label: "Passed", value: stats.passed, color: "from-emerald-500/15 to-teal-500/8", fg: "text-emerald-300", icon: CheckCircle2 },
            { label: "Pending", value: stats.pending, color: "from-orange-500/12 to-amber-500/6", fg: "text-orange-300", icon: Clock },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`rounded-2xl p-4 bg-gradient-to-br ${s.color} border border-white/6`}>
              <s.icon className={`h-4 w-4 ${s.fg} mb-2`} />
              <p className={`text-2xl font-black ${s.fg}`}>{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { v: 'all', l: 'All' },
          { v: 'pending', l: 'Pending' },
          { v: 'passed', l: 'Passed' },
          { v: 'locked', l: 'No Attempts' },
        ].map(tab => (
          <button
            key={tab.v}
            onClick={() => setFilter(tab.v)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === tab.v
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
              : 'bg-white/4 text-slate-400 border border-white/6 hover:bg-white/8 hover:text-slate-200'
              }`}
          >
            {tab.l}
          </button>
        ))}
      </div>

      {/* Quiz Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/8 p-12 text-center">
          <FileQuestion className="h-10 w-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{search ? `No quizzes match "${search}"` : "No quizzes available yet."}</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map(quiz => (
            <motion.div
              key={quiz._id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.25 } } }}
            >
              <div className="group flex flex-col h-full rounded-2xl border border-white/6 overflow-hidden bg-white/3 hover:bg-white/5 transition-all hover:-translate-y-0.5">
                {/* Status strip */}
                <div className={`h-0.5 w-full ${quiz.hasPassed ? 'bg-emerald-500' : quiz.attemptsLeft === 0 ? 'bg-red-500' : 'bg-teal-500'}`} />

                <div className="p-5 flex-1 flex flex-col gap-4">
                  {/* Title & icon */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {quiz.course && (
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 truncate">{quiz.course.title}</p>
                      )}
                      <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors line-clamp-2">{quiz.title}</h3>
                    </div>
                    <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${quiz.hasPassed ? 'bg-emerald-500/15' : quiz.attemptsLeft === 0 ? 'bg-red-500/10' : 'bg-teal-500/10'}`}>
                      {quiz.hasPassed ? <Trophy className="h-4 w-4 text-yellow-400" /> : quiz.attemptsLeft === 0 ? <XCircle className="h-4 w-4 text-red-400" /> : <FileQuestion className="h-4 w-4 text-teal-400" />}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {quiz.hasPassed
                      ? <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/12 px-2.5 py-0.5 rounded-full border border-emerald-500/20">✓ PASSED</span>
                      : quiz.attemptsLeft === 0
                        ? <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/15">NO ATTEMPTS LEFT</span>
                        : <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/15">{quiz.attemptsLeft} attempt{quiz.attemptsLeft !== 1 ? 's' : ''} left</span>
                    }
                  </div>

                  {/* Stats mini grid */}
                  <div className="grid grid-cols-3 gap-2 bg-white/3 rounded-xl p-3 border border-white/5">
                    {[
                      { l: 'Questions', v: quiz.questions_count },
                      { l: 'Time', v: quiz.timer_minutes ? `${quiz.timer_minutes}m` : '∞' },
                      { l: 'Pass', v: `${quiz.pass_percentage}%` },
                    ].map((s, i) => (
                      <div key={i} className={`text-center ${i === 1 ? 'border-x border-white/5' : ''}`}>
                        <p className="text-[10px] text-slate-600 mb-0.5">{s.l}</p>
                        <p className="text-sm font-bold text-slate-200">{s.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Best score bar */}
                  {quiz.attemptsCount > 0 && quiz.bestPercentage !== null && (
                    <div>
                      <div className="flex justify-between text-[10px] mb-1.5">
                        <span className="text-slate-500 flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> Best Score</span>
                        <span className={`font-bold ${quiz.hasPassed ? 'text-emerald-400' : 'text-slate-300'}`}>{quiz.bestPercentage}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5">
                        <div className={`h-full rounded-full ${quiz.hasPassed ? 'bg-emerald-500' : 'bg-slate-500'}`} style={{ width: `${quiz.bestPercentage}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => setActiveQuiz(quiz)}
                    disabled={!quiz.hasPassed && quiz.attemptsLeft === 0}
                    className={`w-full h-10 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${quiz.hasPassed
                      ? 'bg-white/6 text-slate-300 border border-white/8 hover:bg-white/10'
                      : quiz.attemptsLeft === 0
                        ? 'bg-white/3 text-slate-600 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                      }`}
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
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto space-y-5 pb-12">
      <div className="rounded-2xl p-8 text-center border"
        style={{
          background: result.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.07)',
          borderColor: result.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.18)'
        }}>
        {result.passed ? <Trophy className="h-14 w-14 text-yellow-400 mx-auto mb-4" /> : <XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />}
        <h2 className="text-2xl font-black text-white mb-1">{result.passed ? '🎉 Passed!' : 'Quiz Complete'}</h2>
        <p className="text-4xl font-black my-4" style={{ color: result.passed ? '#34d399' : '#f87171' }}>
          {Math.round(result.percentage ?? result.score ?? 0)}%
        </p>
        <p className="text-sm text-slate-400">Need {quiz.pass_percentage}% to pass</p>
        <button onClick={onBack} className="mt-6 px-8 py-2.5 rounded-xl bg-white/8 text-slate-300 font-semibold text-sm hover:bg-white/12 transition-colors">
          Back to Quizzes
        </button>
      </div>
    </motion.div>
  )

  const isLow = (timeLeft || 0) < 60

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl px-5 py-4 border border-white/6 bg-white/3">
        <div>
          <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-300 transition-colors mb-1">← Back</button>
          <h2 className="font-bold text-white text-sm">{quiz.title}</h2>
          {quiz.course && <p className="text-[10px] text-slate-500">{quiz.course.title}</p>}
        </div>
        {timeLeft !== null && (
          <motion.div
            animate={isLow ? { scale: [1, 1.04, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`px-4 py-2 rounded-xl font-mono font-bold text-sm flex items-center gap-2 ${isLow ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-white/6 text-emerald-300 border border-white/8'}`}
          >
            <Clock className="h-4 w-4" /> {fmt(timeLeft)}
          </motion.div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
          <span>{answered}/{quiz.questions.length} answered</span>
          <span>{Math.round((answered / quiz.questions.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" animate={{ width: `${(answered / quiz.questions.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-5">
        {/* Navigator */}
        <div className="hidden md:block">
          <div className="rounded-2xl p-4 border border-white/6 bg-white/3 sticky top-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-3">Navigator</p>
            <div className="grid grid-cols-4 gap-1.5">
              {quiz.questions.map((_, idx) => (
                <button key={idx} onClick={() => setCurrentQ(idx)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${currentQ === idx ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : answers[idx] !== -1 ? 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/15' : 'bg-white/4 text-slate-500 border border-white/5 hover:bg-white/8'}`}>
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="md:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.16 }}>
              <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">Q {currentQ + 1} of {quiz.questions.length}</span>
                  <h3 className="text-sm font-semibold text-white mt-3 leading-relaxed">{q.question}</h3>
                </div>
                <div className="p-5 space-y-2.5">
                  {q.options.map((opt, oi) => (
                    <motion.button key={oi} whileTap={{ scale: 0.99 }}
                      onClick={() => { const next = [...answers]; next[currentQ] = oi; setAnswers(next) }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${answers[currentQ] === oi ? 'border-emerald-500/40 bg-emerald-500/8 text-white' : 'border-white/6 bg-white/2 text-slate-300 hover:bg-white/5 hover:border-white/12 hover:text-white'}`}>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${answers[currentQ] === oi ? 'bg-emerald-500 text-white' : 'bg-white/6 text-slate-500'}`}>
                        {String.fromCharCode(65 + oi)}
                      </div>
                      <span className="text-sm">{opt}</span>
                      {answers[currentQ] === oi && <Zap className="h-4 w-4 text-emerald-400 ml-auto shrink-0" />}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center rounded-xl px-4 py-3 border border-white/6 bg-white/3">
            <button onClick={() => setCurrentQ(p => p - 1)} disabled={currentQ === 0}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg hover:bg-white/4">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-xs text-slate-600">{currentQ + 1}/{quiz.questions.length}</span>
            {currentQ === quiz.questions.length - 1
              ? <button onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {answered < quiz.questions.length ? `${quiz.questions.length - answered} remaining` : 'Submit'}
              </button>
              : <button onClick={() => setCurrentQ(p => p + 1)}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/4">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            }
          </div>
        </div>
      </div>
    </motion.div>
  )
}
