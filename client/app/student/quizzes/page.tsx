"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileQuestion,
  Search,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Trophy,
  HelpCircle,
  Loader2,
  Play,
  RotateCcw,
  XCircle,
  Star
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { EmptyState } from '../../../components/student/EmptyState'
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'

interface Quiz {
  _id: string
  title: string
  description: string
  total_marks: number
  max_attempts: number
  timer_minutes: number | null
  pass_percentage: number
  questions_count: number
  questions: { question: string; options: string[] }[]
  created_at: string
  attemptsCount: number
  attemptsLeft: number
  bestScore: number | null
  bestPercentage: number | null
  hasPassed: boolean
  course: {
    _id: string
    title: string
    thumbnail?: string
  } | null
  instructor: {
    _id: string
    name: string
  } | null
}

export default function QuizzesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) { router.push('/login'); return }

      const response = await fetch(`${API_URL}/api/quizzes/student`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      })

      const data = await response.json()
      if (data.success) {
        setQuizzes(data.data || [])
      } else {
        toast.error(data.message || data.error || "Failed to load quizzes")
      }
    } catch (error) {
      toast.error("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.course?.title || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (filter === "completed") return matchesSearch && quiz.hasPassed
    if (filter === "pending") return matchesSearch && !quiz.hasPassed && quiz.attemptsLeft > 0
    return matchesSearch
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-[#4CAF50]/10 flex items-center justify-center">
            <FileQuestion className="h-8 w-8 text-[#4CAF50] animate-pulse" />
          </div>
          <Loader2 className="absolute -top-1 -right-1 h-6 w-6 animate-spin text-[#4CAF50]" />
        </div>
        <p className="text-slate-500 font-semibold text-lg">Loading quizzes...</p>
      </div>
    )
  }

  if (activeQuiz) {
    return <QuizPlayer quiz={activeQuiz} onBack={() => { setActiveQuiz(null); fetchQuizzes() }} />
  }

  const stats = {
    total: quizzes.length,
    passed: quizzes.filter(q => q.hasPassed).length,
    pending: quizzes.filter(q => !q.hasPassed && q.attemptsLeft > 0).length
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
            My <span className="text-[#4CAF50]">Quizzes</span>
          </h1>
          <p className="text-slate-500 text-base">
            All assessments from your organization — attempt and track your progress.
          </p>
        </div>
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search quizzes or courses..."
            className="pl-10 h-11 border-slate-200 focus-visible:ring-[#4CAF50] rounded-xl bg-white shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Stats row */}
      {quizzes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Total Quizzes", value: stats.total, color: "bg-blue-50 text-blue-700", icon: FileQuestion },
            { label: "Passed", value: stats.passed, color: "bg-green-50 text-green-700", icon: CheckCircle2 },
            { label: "Pending", value: stats.pending, color: "bg-orange-50 text-orange-700", icon: Clock },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${stat.color.split(' ')[0]} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="border-b pb-1">
        <Tabs defaultValue="all" onValueChange={setFilter}>
          <TabsList className="bg-transparent border-0 p-0 gap-2 h-auto">
            {[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" }
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-5 py-2.5 rounded-full text-sm font-semibold data-[state=active]:bg-[#4CAF50] data-[state=active]:text-white data-[state=inactive]:bg-slate-100 data-[state=inactive]:text-slate-600 border-0 shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Quiz Cards */}
      {filteredQuizzes.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredQuizzes.map((quiz) => (
            <motion.div key={quiz._id} variants={itemVariants}>
              <Card className="group h-full flex flex-col overflow-hidden border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl bg-white">
                {/* Top color band with status */}
                <div className={`h-2 w-full ${quiz.hasPassed ? 'bg-green-500' : quiz.attemptsLeft === 0 ? 'bg-red-400' : 'bg-[#4CAF50]'}`} />

                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {quiz.course?.title || "General Quiz"}
                      </p>
                      <CardTitle className="text-lg font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#4CAF50] transition-colors">
                        {quiz.title}
                      </CardTitle>
                    </div>
                    <div className="shrink-0">
                      {quiz.hasPassed ? (
                        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-green-600" />
                        </div>
                      ) : quiz.attemptsLeft === 0 ? (
                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-500" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-[#4CAF50]/10 flex items-center justify-center">
                          <FileQuestion className="h-5 w-5 text-[#4CAF50]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {quiz.hasPassed && (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs w-fit">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Passed
                    </Badge>
                  )}
                  {!quiz.hasPassed && quiz.attemptsLeft === 0 && (
                    <Badge variant="destructive" className="text-xs w-fit">No Attempts Left</Badge>
                  )}
                  {!quiz.hasPassed && quiz.attemptsLeft > 0 && (
                    <Badge variant="secondary" className="text-xs w-fit bg-slate-100 text-slate-600">
                      {quiz.attemptsLeft} attempt{quiz.attemptsLeft !== 1 ? 's' : ''} left
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 flex-grow">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Questions</p>
                      <p className="font-extrabold text-slate-700">{quiz.questions_count}</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Time</p>
                      <p className="font-extrabold text-slate-700">
                        {quiz.timer_minutes ? `${quiz.timer_minutes}m` : '∞'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Pass</p>
                      <p className="font-extrabold text-slate-700">{quiz.pass_percentage}%</p>
                    </div>
                  </div>

                  {/* Best score */}
                  {quiz.attemptsCount > 0 && quiz.bestPercentage !== null && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400" /> Best Score
                        </span>
                        <span className={`text-base font-extrabold ${quiz.hasPassed ? 'text-green-600' : 'text-slate-700'}`}>
                          {quiz.bestPercentage}%
                        </span>
                      </div>
                      <Progress
                        value={quiz.bestPercentage}
                        className={`h-2 ${quiz.hasPassed ? '[&>div]:bg-green-500' : '[&>div]:bg-slate-400'}`}
                      />
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    onClick={() => setActiveQuiz(quiz)}
                    disabled={!quiz.hasPassed && quiz.attemptsLeft === 0}
                    className={`w-full h-11 rounded-xl font-bold text-sm transition-all ${quiz.hasPassed
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none'
                      : 'bg-[#4CAF50] text-white hover:bg-[#43a047] shadow-lg shadow-green-500/20'
                      }`}
                  >
                    {quiz.hasPassed ? (
                      <><RotateCcw className="h-4 w-4 mr-2" />Retake</>
                    ) : quiz.attemptsCount > 0 ? (
                      <><Play className="h-4 w-4 mr-2" />Try Again</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" />Start Quiz<ArrowRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card className="border-0 shadow-lg rounded-3xl">
          <EmptyState
            icon={FileQuestion}
            title={searchQuery ? "No matching quizzes" : "No quizzes available yet"}
            description={searchQuery
              ? `No quizzes match "${searchQuery}"`
              : "Your instructor hasn't published any quizzes yet. Check back soon!"
            }
          />
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INLINE QUIZ PLAYER
// ─────────────────────────────────────────────────────────────
function QuizPlayer({ quiz, onBack }: { quiz: Quiz; onBack: () => void }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1))
  const [timeLeft, setTimeLeft] = useState(quiz.timer_minutes ? quiz.timer_minutes * 60 : null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [startedAt] = useState(new Date().toISOString())

  // Timer countdown
  useEffect(() => {
    if (!timeLeft || result) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const t = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000)
    return () => clearInterval(t)
  }, [timeLeft, result])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60), s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSelect = (optIdx: number) => {
    if (result) return
    const next = [...answers]
    next[currentQ] = optIdx
    setAnswers(next)
  }

  const handleSubmit = async () => {
    if (submitting || result) return
    setSubmitting(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')

      // Build answers array in the format the API expects
      const answersPayload = answers.map((selectedOption, idx) => ({
        question_index: idx,
        selected_option: selectedOption === -1 ? 0 : selectedOption,
        time_spent_seconds: 0
      }))

      const res = await fetch(`${API_URL}/api/quizzes/${quiz._id}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers: answersPayload, started_at: startedAt })
      })

      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        toast.success('Quiz submitted!')
      } else {
        // If enrollment not found, show appropriate message
        if (data.message?.includes('enrolled') || data.error?.includes('Enrollment')) {
          toast.error('You need to enroll in this course to submit. Contact your instructor.')
        } else {
          toast.error(data.message || data.error || 'Submission failed')
        }
      }
    } catch (e) {
      toast.error('Submission failed. Check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const answeredCount = answers.filter(a => a !== -1).length
  const progress = (answeredCount / quiz.questions.length) * 100
  const q = quiz.questions[currentQ]

  if (result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-8 space-y-6">
        <Card className={`border-2 rounded-3xl overflow-hidden ${result.passed ? 'border-green-400' : 'border-red-300'}`}>
          <div className={`p-8 text-center ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
              {result.passed ? <Trophy className="h-10 w-10 text-green-600" /> : <XCircle className="h-10 w-10 text-red-500" />}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-1">
              {result.passed ? '🎉 Congratulations!' : 'Quiz Completed'}
            </h2>
            <p className="text-slate-600 text-lg">
              You scored <span className="font-extrabold text-slate-900">{Math.round(result.percentage ?? result.score ?? 0)}%</span>
            </p>
            {result.passed
              ? <p className="text-green-600 font-semibold mt-1">You passed!</p>
              : <p className="text-red-500 font-semibold mt-1">Keep practicing — you need {quiz.pass_percentage}% to pass</p>
            }
          </div>
          <CardContent className="p-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={onBack} className="rounded-xl px-8">Back to Quizzes</Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto pb-12 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border p-4">
        <div>
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-700 transition-colors mb-1 flex items-center gap-1">
            ← Back
          </button>
          <h2 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{quiz.title}</h2>
          <p className="text-xs text-slate-400">{quiz.course?.title}</p>
        </div>
        {timeLeft !== null && (
          <div className={`px-5 py-2 rounded-full font-mono font-bold text-xl flex items-center gap-2 ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#4CAF50]/10 text-[#4CAF50]'}`}>
            <Clock className="h-5 w-5" /> {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>{answeredCount}/{quiz.questions.length} answered</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2.5 rounded-full" />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Question navigator */}
        <Card className="md:col-span-1 border-0 shadow-sm rounded-2xl hidden md:block">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase tracking-widest text-slate-400">Navigator</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-4 gap-1.5">
              {quiz.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQ(idx)}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${currentQ === idx
                    ? 'bg-[#4CAF50] text-white shadow-md'
                    : answers[idx] !== -1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question card */}
        <div className="md:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="shadow-lg border-t-4 border-t-[#4CAF50] rounded-2xl">
                <CardHeader className="pb-3">
                  <Badge variant="secondary" className="w-fit mb-2 text-xs">Question {currentQ + 1}</Badge>
                  <CardTitle className="text-lg font-bold leading-relaxed text-slate-800">
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.options.map((opt, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${answers[currentQ] === idx
                        ? 'border-[#4CAF50] bg-[#4CAF50]/5 shadow-sm'
                        : 'border-slate-100 hover:border-[#4CAF50]/40 hover:bg-slate-50'
                        }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${answers[currentQ] === idx ? 'bg-[#4CAF50] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium text-slate-700">{opt}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border p-3">
            <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)} className="rounded-xl">
              ← Prev
            </Button>
            {currentQ === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < quiz.questions.length}
                className="bg-[#4CAF50] hover:bg-[#43a047] text-white rounded-xl px-8 font-bold shadow-lg"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {answeredCount < quiz.questions.length
                  ? `Answer ${quiz.questions.length - answeredCount} more`
                  : 'Submit Quiz'}
              </Button>
            ) : (
              <Button onClick={() => setCurrentQ(p => p + 1)} className="bg-slate-800 text-white rounded-xl">
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
