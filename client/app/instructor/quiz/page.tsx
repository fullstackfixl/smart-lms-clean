"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import {
  Brain,
  ClipboardCheck,
  Trash2,
  Plus,
  BookOpen,
  Target,
  ShieldCheck,
  CheckCircle2,
  Search,
  X,
  RefreshCw,
  Sparkles
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { useAuth } from '../../../lib/auth-context'
import { instructorApi } from '../../../lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'

interface Quiz {
  _id: string
  title: string
  description: string
  course_id?: { _id: string; title: string }
  questions: any[]
  status: "published" | "draft"
  pass_percentage: number
  max_attempts: number
  totalSubmissions?: number
  avgScore?: number
}

interface Course {
  _id: string
  title: string
}

function MetricCard({ label, value, icon: Icon, color = "blue" }: { label: string; value: string | number; icon: any; color?: "blue" | "green" | "orange" | "indigo" }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500" },
    green: { bg: "bg-green-50", icon: "text-green-500" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-500" },
  }
  const c = colors[color]
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${c.bg} rounded-md flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon} stroke-[1.5]`} />
        </div>
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function QuizContent() {
  const { token } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Generator Form
  const [courseId, setCourseId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [difficulty, setDifficulty] = useState("medium")
  const [numQuestions, setNumQuestions] = useState(5)

  // Generated Preview
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null)

  useEffect(() => {
    if (token) loadInitialData()
  }, [token])

  async function loadInitialData() {
    setLoading(true)
    try {
      const coursesRes = await instructorApi.listCourses(token!, "limit=100")
      if (coursesRes.success) {
        const list = (coursesRes.data as any).courses || []
        setCourses(list)
        if (list.length > 0 && !courseId) {
          setCourseId(list[0]._id)
        }
      }

      // Load quizzes for all courses
      if (courseId) {
        await loadQuizzes(courseId)
      }
    } catch (error) {
      toast.error("Failed to synchronize assessment data")
    } finally {
      setLoading(false)
    }
  }

  async function loadQuizzes(cid: string) {
    try {
      const quizzesRes = await instructorApi.listCourseQuizzes(token!, cid)
      if (quizzesRes.success) {
        const payload: any = quizzesRes.data
        const quizzesData = payload?.quizzes || (Array.isArray(payload) ? payload : [])
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
      }
    } catch (error) {
      console.error("Failed to load quizzes", error)
    }
  }

  useEffect(() => {
    if (!token || !courseId) return
    loadQuizzes(courseId)
  }, [token, courseId])

  async function handleGenerate() {
    if (!courseId || !prompt) {
      toast.error("Please provide a course and topic for generation.")
      return
    }

    setGenerating(true)
    setGeneratedQuiz(null)

    try {
      const res = await instructorApi.generateAIQuiz(token!, {
        course_id: courseId,
        topic: prompt,
        difficulty,
        num_questions: numQuestions
      })

      if (res.success) {
        setGeneratedQuiz((res.data as any).quiz)
        toast.success("AI Quiz generated successfully.")
      } else {
        toast.error(res.error || "Failed to generate quiz")
      }
    } catch (error) {
      toast.error("Network error during quiz generation")
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish() {
    if (!courseId || !generatedQuiz) return

    setGenerating(true)
    try {
      const create = await instructorApi.createQuiz(token!, courseId, {
        title: generatedQuiz.title || `Quiz: ${prompt.slice(0, 30)}`,
        description: `AI-Generated quiz for: ${prompt}`,
        questions: generatedQuiz.questions,
        pass_percentage: 60,
        max_attempts: 3,
      })

      if (!create.success) {
        toast.error(create.error || 'Failed to create quiz')
        return
      }

      const createdId = (create.data as any)?._id || (create.data as any)?.quiz?._id || (create.data as any)?.id
      if (createdId) {
        await instructorApi.publishQuiz(token!, createdId)
      }

      toast.success("Quiz published and added to course.")
      loadInitialData()
      setGeneratedQuiz(null)
      setShowGenerator(false)
    } catch {
      toast.error("Failed to publish quiz")
    } finally {
      setGenerating(false)
    }
  }

  async function handleDeleteQuiz(id: string) {
    if (!confirm("Delete this quiz?")) return
    try {
      const res = await instructorApi.deleteQuiz(token!, id)
      if (res.success) {
        toast.success("Quiz deleted")
        loadQuizzes(courseId)
      } else {
        toast.error(res.error || "Failed to delete quiz")
      }
    } catch (error) {
      toast.error("Error deleting quiz")
    }
  }

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.course_id?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const publishedCount = quizzes.filter(q => q.status === 'published').length
  const draftCount = quizzes.filter(q => q.status === 'draft').length
  const avgScore = quizzes.filter(q => q.avgScore && q.avgScore > 0).reduce((sum, q) => sum + (q.avgScore || 0), 0) / (quizzes.filter(q => q.avgScore && q.avgScore > 0).length || 1)
  const totalSubmissions = quizzes.reduce((sum, q) => sum + (q.totalSubmissions || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <Brain className="w-3.5 h-3.5" />
            Performance Assessments
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Quiz Management</h1>
          <p className="text-slate-500 mt-1">Create, manage, and distribute assessments for your students.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadInitialData()} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowGenerator(!showGenerator)}
            className={showGenerator ? "bg-gray-600" : "bg-orange-500 hover:bg-orange-600"}
          >
            {showGenerator ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showGenerator ? "Cancel" : "Create New Quiz"}
          </Button>
        </div>
      </div>

      {!showGenerator && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Total Quizzes" value={quizzes.length} icon={ClipboardCheck} color="blue" />
          <MetricCard label="Published" value={publishedCount} icon={ShieldCheck} color="green" />
          <MetricCard label="Avg. Score" value={`${Math.round(avgScore) || 0}%`} icon={Target} color="orange" />
          <MetricCard label="Total Attempts" value={totalSubmissions} icon={Brain} color="indigo" />
        </div>
      )}

      {showGenerator ? (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="h-10 border-gray-200">
                      <SelectValue placeholder="Select course..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="h-10 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Beginner</SelectItem>
                        <SelectItem value="medium">Intermediate</SelectItem>
                        <SelectItem value="hard">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Questions</label>
                    <Select value={numQuestions.toString()} onValueChange={(val) => setNumQuestions(parseInt(val))}>
                      <SelectTrigger className="h-10 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Questions</SelectItem>
                        <SelectItem value="5">5 Questions</SelectItem>
                        <SelectItem value="10">10 Questions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Topic or Concept Focus</label>
                  <textarea
                    placeholder="Describe the topics you want the AI to generate questions for..."
                    className="w-full h-32 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {generating ? "Generating..." : <><Sparkles className="w-4 h-4 mr-2" /> Generate AI Quiz</>}
                </Button>
              </div>
            </div>
          </div>

          {generatedQuiz && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Preview: {generatedQuiz.title}</h3>
                <Button onClick={handlePublish} disabled={generating} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Publish Quiz
                </Button>
              </div>
              <div className="space-y-4">
                {generatedQuiz.questions.map((q: any, i: number) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-md p-4">
                    <p className="font-medium text-slate-900 mb-2">{i + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt: string, optIdx: number) => (
                        <div 
                          key={optIdx} 
                          className={cn(
                            "p-2 rounded border text-sm",
                            optIdx === q.correct_answer 
                              ? "bg-green-50 border-green-200 text-green-800" 
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          )}
                        >
                          {String.fromCharCode(65 + optIdx)}. {opt}
                          {optIdx === q.correct_answer && <span className="ml-2 text-green-600 font-medium">(Correct)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.5]" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full pl-10 pr-4 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz._id} className="bg-white border border-gray-200 rounded-md p-5 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                      quiz.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    )}>
                      {quiz.status}
                    </span>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 h-8 w-8 p-0" onClick={() => handleDeleteQuiz(quiz._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{quiz.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{quiz.description}</p>
                {quiz.course_id && <div className="text-xs text-slate-400 mb-4">{quiz.course_id.title}</div>}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">{quiz.questions?.length || 0} questions</span>
                    {quiz.avgScore !== undefined && quiz.avgScore > 0 && (
                      <span className="text-green-600 font-medium">Avg: {Math.round(quiz.avgScore)}%</span>
                    )}
                  </div>
                  {quiz.totalSubmissions !== undefined && quiz.totalSubmissions > 0 && (
                    <span className="text-slate-500">{quiz.totalSubmissions} attempts</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function InstructorQuizPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading quizzes...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
