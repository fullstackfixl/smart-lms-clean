"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Brain,
  ClipboardCheck,
  Trash2,
  Save,
  Send,
  Loader2,
  AlertCircle,
  Plus,
  BookOpen,
  ChevronRight,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  generateAIQuiz,
  publishQuiz,
  getInstructorQuizzes,
  getCourses
} from "@/lib/services/instructorApi"

export default function InstructorQuizPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)

  // Generator Form
  const [courseId, setCourseId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [difficulty, setDifficulty] = useState("medium")
  const [numQuestions, setNumQuestions] = useState(5)

  // Preview Section
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    try {
      const [coursesRes, quizzesRes] = await Promise.all([
        getCourses({ limit: 100 }),
        getInstructorQuizzes()
      ])

      if (coursesRes.success) setCourses(coursesRes.data.courses || [])
      if (quizzesRes.success) setQuizzes(quizzesRes.data || [])
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!courseId || !prompt) {
      toast.error("Please select a course and enter a topic")
      return
    }

    setGenerating(true)
    setGeneratedQuiz(null)

    try {
      const res = await generateAIQuiz({
        courseId,
        prompt,
        difficulty,
        numQuestions
      })

      if (res.success) {
        setGeneratedQuiz(res.data.quiz)
        toast.success("AI Quiz generated successfully!")
      } else {
        toast.error(res.message || "Failed to generate quiz")
      }
    } catch (error) {
      toast.error("An error occurred during generation")
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(quizId: string | null) {
    try {
      setGenerating(true)

      let targetId = quizId

      // If not saved yet (_id is null), save it first via POST /api/quizzes
      if (!targetId) {
        if (!courseId || !generatedQuiz) {
          toast.error("Missing course or quiz data")
          setGenerating(false)
          return
        }
        const token = typeof window !== "undefined"
          ? (window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token"))
          : null

        const { API_URL } = await import("@/lib/config")
        const saveRes = await fetch(`${API_URL}/api/quizzes`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            course_id: courseId,
            title: generatedQuiz.title || `AI Quiz: ${prompt.slice(0, 40)}`,
            description: `AI-generated quiz on: ${prompt}`,
            questions: generatedQuiz.questions,
            pass_percentage: 60,
            max_attempts: 3
          })
        })
        const saveJson = await saveRes.json()
        if (!saveJson.success) {
          toast.error(saveJson.message || "Failed to save quiz")
          setGenerating(false)
          return
        }
        targetId = saveJson.data._id
        toast.success("Quiz saved! Publishing now...")
      }

      const res = await publishQuiz(targetId!)
      if (res.success) {
        toast.success("🎉 Quiz published! Students will be notified.")
        loadInitialData()
        setGeneratedQuiz(null)
        setShowGenerator(false)
      } else {
        toast.error(res.message || "Failed to publish quiz")
      }
    } catch (error) {
      toast.error("Failed to publish quiz")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading your quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Quiz Management
          </h1>
          <p className="text-slate-400 mt-2">Create and manage AI-powered assessments for your students.</p>
        </div>
        {!showGenerator && (
          <Button
            onClick={() => setShowGenerator(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-6 h-auto transition-all shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            AI Quiz Generator
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showGenerator ? (
          <motion.div
            key="generator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="bg-slate-900/80 border-slate-800/50 backdrop-blur-sm overflow-hidden border-2 border-indigo-500/30">
              <CardHeader className="border-b border-slate-800/50 bg-indigo-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>AI Quiz Generator</CardTitle>
                      <CardDescription>Leverage Gemini AI to create high-quality assessments</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setShowGenerator(false)
                    setGeneratedQuiz(null)
                  }}>Cancel</Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Select Target Course</Label>
                      <Select value={courseId} onValueChange={setCourseId}>
                        <SelectTrigger className="bg-slate-950 border-slate-800">
                          <SelectValue placeholder="Choose a course..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          {courses.map(course => (
                            <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-200">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger className="bg-slate-950 border-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value="easy">Beginner</SelectItem>
                            <SelectItem value="medium">Intermediate</SelectItem>
                            <SelectItem value="hard">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-200">Questions</Label>
                        <Select value={numQuestions.toString()} onValueChange={(val) => setNumQuestions(parseInt(val))}>
                          <SelectTrigger className="bg-slate-950 border-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800">
                            <SelectItem value="3">3 Questions</SelectItem>
                            <SelectItem value="5">5 Questions</SelectItem>
                            <SelectItem value="10">10 Questions</SelectItem>
                            <SelectItem value="15">15 Questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Topic or Context</Label>
                    <Textarea
                      placeholder="e.g. Fundamental concepts of Javascript Promises and Async/Await..."
                      className="min-h-[120px] bg-slate-950 border-slate-800 resize-none h-full"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">The more specific you are, the better the AI results will be.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-800/50 bg-slate-950/50 justify-end py-4">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[140px]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {generatedQuiz && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-200">Preview: {generatedQuiz.title}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-800 text-slate-300">
                      <Save className="w-4 h-4 mr-2" />
                      Keep as Draft
                    </Button>
                    <Button
                      onClick={() => handlePublish(generatedQuiz._id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Publish to Course
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {generatedQuiz.questions.map((q: any, i: number) => (
                    <Card key={i} className="bg-slate-900/50 border-slate-800/80">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                            {i + 1}
                          </span>
                          <div className="flex-1 space-y-4">
                            <p className="text-lg text-slate-200 font-medium">{q.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt: string, optIdx: number) => (
                                <div
                                  key={optIdx}
                                  className={`p-3 rounded-xl border text-sm transition-all ${optIdx === q.correct_answer
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/20'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                                    }`}
                                >
                                  <span className="inline-block w-6 font-bold text-xs uppercase mr-2 opacity-50">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  {opt}
                                  {optIdx === q.correct_answer && (
                                    <span className="ml-2 text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter shadow-sm">Correct</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 flex gap-3 text-sm text-indigo-300/80">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-indigo-400" />
                                <p><span className="font-bold text-indigo-400">Explanation:</span> {q.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* My Quizzes List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-semibold text-slate-200">Recent Quizzes</h3>
                {quizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40">
                    <ClipboardCheck className="w-16 h-16 text-slate-700 mb-4" />
                    <p className="text-slate-400 text-lg">You haven't created any quizzes yet</p>
                    <Button
                      variant="link"
                      className="text-indigo-400 mt-2"
                      onClick={() => setShowGenerator(true)}
                    >
                      Start fresh with AI Generator
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz: any) => (
                      <Card key={quiz._id} className="bg-slate-900/80 border-slate-800/50 hover:border-slate-700 transition-all group">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${quiz.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors uppercase text-sm tracking-wide">
                                {quiz.title}
                              </h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-500 font-medium">
                                  {quiz.course_id?.title || "Generic Course"}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-xs text-slate-500">
                                  {quiz.questions?.length || 0} Questions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={quiz.status === 'PUBLISHED' ? "default" : "secondary"} className={
                              quiz.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                            }>
                              {quiz.status}
                            </Badge>
                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-400 h-9 w-9 p-0">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-slate-400 transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-none text-white overflow-hidden relative shadow-2xl shadow-indigo-500/20">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-24 h-24 rotate-12" />
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                      Why use AI?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-indigo-100 text-sm leading-relaxed">
                      Spend less time typing and more time teaching. Gemini can generate context-aware questions from your course materials instantly.
                    </p>
                    <ul className="space-y-2 text-sm text-indigo-50/80">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                        Instant JSON generation
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                        Correct answer explanations
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
                        Multiple difficulty levels
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                  <h4 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Quick Tips
                  </h4>
                  <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
                    <p>• Be specific with your topic prompts for better question variety.</p>
                    <p>• Quizzes are saved as drafts by default for your final review.</p>
                    <p>• Students can only see quizzes once you hit <strong>Publish</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
