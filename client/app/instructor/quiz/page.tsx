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
  Sparkles,
  Edit2,
  Save
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { useAuth } from '../../../lib/auth-context'
import { instructorApi, courseApi, collegeApi } from '../../../lib/api'
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

interface InstructorSubject {
  _id: string
  name: string
  code: string
  batchId?: string | null
  batch?: { _id: string; name: string; code: string; year?: number; semester?: number } | null
  contentCourseId?: string | null
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
  const { token, user } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<InstructorSubject[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  // Generator Form
  const [courseId, setCourseId] = useState("")
  const [subjectKey, setSubjectKey] = useState("")
  const [prompt, setPrompt] = useState("")
  const [difficulty, setDifficulty] = useState("medium")
  const [numQuestions, setNumQuestions] = useState(5)

  // Generated Preview
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null)

  const [draftMode, setDraftMode] = useState<'ai' | 'manual'>('ai')
  const [draftForm, setDraftForm] = useState({
    title: '',
    description: '',
    questions: [] as any[],
    pass_percentage: 60,
    max_attempts: 3
  })

  // Edit state
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    questions: [] as any[],
    pass_percentage: 60,
    max_attempts: 3
  })

  useEffect(() => {
    if (token) loadInitialData()
  }, [token])

  async function loadInitialData() {
    setLoading(true)
    try {
      if (isCollege) {
        const subjectsRes = await instructorApi.listSubjects(token!)
        if (subjectsRes.success) {
          const list = (subjectsRes.data as any) || []
          setSubjects(Array.isArray(list) ? list : [])
          if (!subjectKey && Array.isArray(list) && list.length > 0) {
            const first = list[0]
            const firstBatchId = (first.batchId || first?.batch?._id || '')
            const key = `${first._id}:${firstBatchId || ''}`
            setSubjectKey(key)
            if (first.contentCourseId) setCourseId(String(first.contentCourseId))
          }
        }
      } else {
        const coursesRes = await instructorApi.listCourses(token!, "limit=100")
        if (coursesRes.success) {
          const list = (coursesRes.data as any).courses || []
          setCourses(list)
          if (list.length > 0 && !courseId) {
            setCourseId(list[0]._id)
          }
        }
      }

      // Load all quizzes for this instructor
      const quizzesRes = await instructorApi.listAllQuizzes(token!)
      if (quizzesRes.success) {
        const payload: any = quizzesRes.data
        const quizzesData = payload?.quizzes || (Array.isArray(payload) ? payload : [])
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : [])
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
    if (!token) return
    loadInitialData()
  }, [token])

  async function handleGenerate() {
    if ((!courseId && !isCollege) || !prompt) {
      toast.error("Please provide a subject/course and topic for generation.")
      return
    }

    if (isCollege && !subjectKey) {
      toast.error('Please select a subject')
      return
    }

    setGenerating(true)
    setGeneratedQuiz(null)

    try {
      const [subjectId, batchId] = isCollege ? subjectKey.split(':') : [null, null]
      
      // Build API payload - only include subject/batch if they exist
      const apiPayload: any = {
        course_id: courseId,
        topic: prompt,
        difficulty,
        num_questions: numQuestions
      }
      
      if (isCollege && subjectId && batchId) {
        apiPayload.subjectId = subjectId
        apiPayload.batchId = batchId
      }
      
      const res = await instructorApi.generateAIQuiz(token!, apiPayload)

      if (res.success) {
        const payload: any = res.data
        const questions = payload?.questions || payload?.data?.questions || []
        const quizDraft = {
          title: `Quiz: ${prompt.slice(0, 40)}`,
          questions,
          course_id: courseId,
          _id: null
        }
        setGeneratedQuiz(quizDraft)
        setDraftMode('ai')
        setDraftForm({
          title: quizDraft?.title || `Quiz: ${prompt.slice(0, 40)}`,
          description: `AI-Generated quiz for: ${prompt}`,
          questions: quizDraft?.questions || [],
          pass_percentage: 60,
          max_attempts: 3
        })
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
    if (isCollege && !subjectKey) {
      toast.error('Please select a subject from the dropdown')
      return
    }
    
    if (!draftForm.questions || draftForm.questions.length === 0) {
      toast.error('Please add at least one question to the quiz')
      return
    }

    setGenerating(true)
    try {
      const [subjectId, batchId] = isCollege ? subjectKey.split(':') : [null, null]
      
      // Build payload - backend will auto-resolve course from subject
      const payload: any = {
        title: draftForm.title || generatedQuiz?.title || `Quiz: ${prompt.slice(0, 30)}`,
        description: draftForm.description || `AI-Generated quiz for: ${prompt}`,
        questions: draftForm.questions || generatedQuiz?.questions || [],
        pass_percentage: draftForm.pass_percentage,
        max_attempts: draftForm.max_attempts
      }
      
      // Add subject+batch for college flow (backend auto-resolves course)
      if (isCollege && subjectId && batchId) {
        payload.subjectId = subjectId
        payload.batchId = batchId
      } else if (courseId) {
        // Legacy flow with course_id
        payload.course_id = courseId
      }

      console.log('Creating quiz with payload:', payload)
      const create = await instructorApi.createAcademicQuiz(token!, payload)

      if (!create.success) {
        console.error('Create quiz failed:', create)
        toast.error(create.error || 'Failed to create quiz')
        return
      }

      const createdId = (create.data as any)?._id || (create.data as any)?.quiz?._id || (create.data as any)?.id
      console.log('Quiz created with ID:', createdId)
      
      if (createdId) {
        const pubRes = await instructorApi.publishQuiz(token!, createdId)
        if (!pubRes.success) {
          console.error('Publish failed:', pubRes)
          toast.error(pubRes.error || 'Failed to publish quiz')
          return
        }
      }

      toast.success("Quiz published successfully!")
      loadInitialData()
      setGeneratedQuiz(null)
      setDraftForm({ title: '', description: '', questions: [], pass_percentage: 60, max_attempts: 3 })
      setShowGenerator(false)
    } catch (err: any) {
      console.error('Publish error:', err)
      toast.error(err?.message || "Failed to publish quiz")
    } finally {
      setGenerating(false)
    }
  }

  async function ensureCourseForSubject(subject: InstructorSubject) {
    if (subject.contentCourseId) return subject.contentCourseId
    
    toast.info('Creating content course for this subject...')
    
    // Create a course for this subject
    const courseRes = await courseApi.create(token!, {
      title: `${subject.name} - Content`,
      description: `Auto-created content course for ${subject.name} (${subject.code})`,
      category: 'Academic'
    })
    
    if (!courseRes.success) {
      toast.error('Failed to create content course. Please contact admin.')
      return null
    }
    
    const newCourseId = (courseRes.data as any)?._id || (courseRes.data as any)?.id
    if (!newCourseId) {
      toast.error('Course created but ID not returned')
      return null
    }
    
    // Update subject with contentCourseId
    const updateRes = await collegeApi.updateSubject(token!, subject._id, {
      contentCourseId: newCourseId
    })
    
    if (!updateRes.success) {
      toast.error('Failed to link course to subject')
      return null
    }
    
    toast.success('Content course linked successfully')
    return newCourseId
  }

  function addDraftQuestion() {
    setDraftForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' }]
    }))
  }

  function updateDraftQuestion(index: number, field: string, value: any) {
    const updated = [...draftForm.questions]
    updated[index] = { ...updated[index], [field]: value }
    setDraftForm(prev => ({ ...prev, questions: updated }))
  }

  function updateDraftOption(qIndex: number, optIndex: number, value: string) {
    const updated = [...draftForm.questions]
    updated[qIndex].options[optIndex] = value
    setDraftForm(prev => ({ ...prev, questions: updated }))
  }

  function removeDraftQuestion(index: number) {
    setDraftForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  async function handleDeleteQuiz(id: string) {
    if (!confirm("Delete this quiz?")) return
    try {
      const res = await instructorApi.deleteQuiz(token!, id)
      if (res.success) {
        toast.success("Quiz deleted")
        loadInitialData()
      } else {
        toast.error(res.error || "Failed to delete quiz")
      }
    } catch (error) {
      toast.error("Error deleting quiz")
    }
  }

  function startEditQuiz(quiz: Quiz) {
    setEditingQuiz(quiz)
    setEditForm({
      title: quiz.title,
      description: quiz.description || '',
      questions: quiz.questions || [],
      pass_percentage: quiz.pass_percentage || 60,
      max_attempts: quiz.max_attempts || 3
    })
  }

  function cancelEdit() {
    setEditingQuiz(null)
    setEditForm({ title: '', description: '', questions: [], pass_percentage: 60, max_attempts: 3 })
  }

  async function saveQuizEdit() {
    if (!editingQuiz) return
    try {
      const res = await instructorApi.updateQuiz(token!, editingQuiz._id, editForm)
      if (res.success) {
        toast.success("Quiz updated successfully")
        cancelEdit()
        loadInitialData()
      } else {
        toast.error(res.error || "Failed to update quiz")
      }
    } catch (error) {
      toast.error("Error updating quiz")
    }
  }

  function addQuestion() {
    setEditForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' }]
    }))
  }

  function updateQuestion(index: number, field: string, value: any) {
    const updated = [...editForm.questions]
    updated[index] = { ...updated[index], [field]: value }
    setEditForm(prev => ({ ...prev, questions: updated }))
  }

  function updateOption(qIndex: number, optIndex: number, value: string) {
    const updated = [...editForm.questions]
    updated[qIndex].options[optIndex] = value
    setEditForm(prev => ({ ...prev, questions: updated }))
  }

  function removeQuestion(index: number) {
    setEditForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">{isCollege ? 'Subject (Batch)' : 'Course'}</label>
                  {isCollege ? (
                    <Select
                      value={subjectKey}
                      onValueChange={(val) => {
                        setSubjectKey(val)
                        const [sid] = val.split(':')
                        const selected = subjects.find(s => String(s._id) === String(sid))
                        if (selected?.contentCourseId) setCourseId(String(selected.contentCourseId))
                      }}
                    >
                      <SelectTrigger className="h-10 border-gray-200">
                        <SelectValue placeholder="Select subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(sub => {
                          const bid = (sub.batchId || sub?.batch?._id || '') as string
                          const key = `${sub._id}:${bid || ''}`
                          const batchLabel = sub?.batch?.name || sub?.batch?.code || ''
                          const extra = batchLabel ? ` • ${batchLabel}` : ''
                          return (
                            <SelectItem key={key} value={key}>{`${sub.name} (${sub.code})${extra}`}</SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
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
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
                  <Select value={draftMode} onValueChange={(v: any) => {
                    setDraftMode(v)
                    setGeneratedQuiz(null)
                    setDraftForm({ title: '', description: '', questions: [], pass_percentage: 60, max_attempts: 3 })
                  }}>
                    <SelectTrigger className="h-10 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">AI Generated</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
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
                  onClick={draftMode === 'ai' ? handleGenerate : () => {
                    if (isCollege && !subjectKey) {
                      toast.error('Please select a subject')
                      return
                    }
                    if (!courseId) {
                      toast.error('Please select a course/subject')
                      return
                    }
                    if (!draftForm.title || !draftForm.questions.length) {
                      toast.error('Please add title and at least one question')
                      return
                    }
                    handlePublish()
                  }}
                  disabled={generating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {draftMode === 'ai'
                    ? (generating ? "Generating..." : <><Sparkles className="w-4 h-4 mr-2" /> Generate AI Quiz</>)
                    : (generating ? "Publishing..." : <><CheckCircle2 className="w-4 h-4 mr-2" /> Publish Manual Quiz</>)}
                </Button>
              </div>
            </div>
          </div>

          {(draftMode === 'ai' && generatedQuiz) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Edit & Publish</h3>
                <Button onClick={handlePublish} disabled={generating} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Publish Quiz
                </Button>
              </div>
              <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    value={draftForm.title}
                    onChange={(e) => setDraftForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={draftForm.description}
                    onChange={(e) => setDraftForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full h-20 px-3 py-2 border border-gray-200 rounded-md text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pass %</label>
                    <input
                      type="number"
                      value={draftForm.pass_percentage}
                      onChange={(e) => setDraftForm(prev => ({ ...prev, pass_percentage: parseInt(e.target.value) }))}
                      className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
                    <input
                      type="number"
                      value={draftForm.max_attempts}
                      onChange={(e) => setDraftForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) }))}
                      className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Questions ({draftForm.questions.length})</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addDraftQuestion}><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
                  </div>

                  {draftForm.questions.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="border rounded-md p-4 mb-4 bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium">Q{qIdx + 1}</span>
                        <Button variant="ghost" size="sm" className="text-red-600 h-6 w-6 p-0" onClick={() => removeDraftQuestion(qIdx)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <input
                        type="text"
                        placeholder="Question text"
                        value={q.question}
                        onChange={(e) => updateDraftQuestion(qIdx, 'question', e.target.value)}
                        className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm mb-3"
                      />
                      <div className="space-y-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`draft-correct-${qIdx}`}
                              checked={q.correct_answer === optIdx}
                              onChange={() => updateDraftQuestion(qIdx, 'correct_answer', optIdx)}
                            />
                            <input
                              type="text"
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              value={opt}
                              onChange={(e) => updateDraftOption(qIdx, optIdx, e.target.value)}
                              className="flex-1 h-8 px-2 border border-gray-200 rounded text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(draftMode === 'manual') && (
            <div className="bg-white border border-gray-200 rounded-md p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
                <input
                  type="text"
                  value={draftForm.title}
                  onChange={(e) => setDraftForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={draftForm.description}
                  onChange={(e) => setDraftForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-20 px-3 py-2 border border-gray-200 rounded-md text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pass %</label>
                  <input
                    type="number"
                    value={draftForm.pass_percentage}
                    onChange={(e) => setDraftForm(prev => ({ ...prev, pass_percentage: parseInt(e.target.value) }))}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
                  <input
                    type="number"
                    value={draftForm.max_attempts}
                    onChange={(e) => setDraftForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) }))}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Questions ({draftForm.questions.length})</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addDraftQuestion}><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
                </div>

                {draftForm.questions.map((q: any, qIdx: number) => (
                  <div key={qIdx} className="border rounded-md p-4 mb-4 bg-slate-50">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium">Q{qIdx + 1}</span>
                      <Button variant="ghost" size="sm" className="text-red-600 h-6 w-6 p-0" onClick={() => removeDraftQuestion(qIdx)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    <input
                      type="text"
                      placeholder="Question text"
                      value={q.question}
                      onChange={(e) => updateDraftQuestion(qIdx, 'question', e.target.value)}
                      className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm mb-3"
                    />
                    <div className="space-y-2">
                      {q.options.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`manual-correct-${qIdx}`}
                            checked={q.correct_answer === optIdx}
                            onChange={() => updateDraftQuestion(qIdx, 'correct_answer', optIdx)}
                          />
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={opt}
                            onChange={(e) => updateDraftOption(qIdx, optIdx, e.target.value)}
                            className="flex-1 h-8 px-2 border border-gray-200 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : editingQuiz ? (
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Edit Quiz</h2>
            <Button variant="ghost" onClick={cancelEdit}><X className="w-5 h-5" /></Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-20 px-3 py-2 border border-gray-200 rounded-md text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pass %</label>
                <input
                  type="number"
                  value={editForm.pass_percentage}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pass_percentage: parseInt(e.target.value) }))}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Max Attempts</label>
                <input
                  type="number"
                  value={editForm.max_attempts}
                  onChange={(e) => setEditForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) }))}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Questions ({editForm.questions.length})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
              </div>
              
              {editForm.questions.map((q, qIdx) => (
                <div key={qIdx} className="border rounded-md p-4 mb-4 bg-slate-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium">Q{qIdx + 1}</span>
                    <Button variant="ghost" size="sm" className="text-red-600 h-6 w-6 p-0" onClick={() => removeQuestion(qIdx)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <input
                    type="text"
                    placeholder="Question text"
                    value={q.question}
                    onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm mb-3"
                  />
                  <div className="space-y-2">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correct_answer === optIdx}
                          onChange={() => updateQuestion(qIdx, 'correct_answer', optIdx)}
                        />
                        <input
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          className="flex-1 h-8 px-2 border border-gray-200 rounded text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={cancelEdit}>Cancel</Button>
              <Button className="flex-1 bg-blue-600" onClick={saveQuizEdit}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
            </div>
          </div>
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
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0" onClick={() => startEditQuiz(quiz)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
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
