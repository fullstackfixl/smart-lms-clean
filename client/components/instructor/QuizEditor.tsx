"use client"

import { useState } from "react"
import { 
  Plus, 
  Trash2, 
  Check, 
  Settings, 
  Brain, 
  Save, 
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  Target,
  FileQuestion,
  Info
} from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Label } from "../ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"

interface Question {
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

interface QuizData {
  title: string
  description: string
  questions: Question[]
  timer_minutes: number
  pass_percentage: number
  max_attempts: number
}

interface QuizEditorProps {
  initialData?: Partial<QuizData>
  onSave: (data: QuizData) => void
  onCancel: () => void
  isAI?: boolean
}

export function QuizEditor({ initialData, onSave, onCancel, isAI = false }: QuizEditorProps) {
  const [quiz, setQuiz] = useState<QuizData>({
    title: initialData?.title || (isAI ? "AI Generated Quiz" : "New Quiz"),
    description: initialData?.description || "Enter quiz description here...",
    questions: initialData?.questions || [
      { question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" }
    ],
    timer_minutes: initialData?.timer_minutes || 15,
    pass_percentage: initialData?.pass_percentage || 60,
    max_attempts: initialData?.max_attempts || 3
  })

  const [activeQuestion, setActiveQuestion] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const addQuestion = () => {
    const newQuestions = [...quiz.questions, { 
      question: "", 
      options: ["", "", "", ""], 
      correct_answer: 0, 
      explanation: "" 
    }]
    setQuiz({ ...quiz, questions: newQuestions })
    setActiveQuestion(newQuestions.length - 1)
  }

  const removeQuestion = (index: number) => {
    if (quiz.questions.length <= 1) {
      toast.error("Quiz must have at least one question")
      return
    }
    const newQuestions = quiz.questions.filter((_, i) => i !== index)
    setQuiz({ ...quiz, questions: newQuestions })
    if (activeQuestion >= newQuestions.length) {
      setActiveQuestion(newQuestions.length - 1)
    }
  }

  const updateQuestion = (field: keyof Question, value: any) => {
    const newQuestions = [...quiz.questions]
    newQuestions[activeQuestion] = { ...newQuestions[activeQuestion], [field]: value }
    setQuiz({ ...quiz, questions: newQuestions })
  }

  const updateOption = (optionIndex: number, value: string) => {
    const newQuestions = [...quiz.questions]
    const newOptions = [...newQuestions[activeQuestion].options]
    newOptions[optionIndex] = value
    newQuestions[activeQuestion] = { ...newQuestions[activeQuestion], options: newOptions }
    setQuiz({ ...quiz, questions: newQuestions })
  }

  const handleSave = () => {
    // Basic validation
    if (!quiz.title.trim()) {
      toast.error("Please provide a quiz title")
      return
    }
    
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i]
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty`)
        setActiveQuestion(i)
        return
      }
      if (q.options.some(o => !o.trim())) {
        toast.error(`Question ${i + 1} has empty options`)
        setActiveQuestion(i)
        return
      }
    }

    onSave(quiz)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/95 flex flex-col backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-200 bg-white/80 px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5 text-slate-500" />
          </Button>
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              isAI ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
            )}>
              {isAI ? <Brain className="w-5 h-5" /> : <FileQuestion className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">
                {isAI ? "Review AI Quiz" : "Quiz Creator"}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {quiz.questions.length} Questions • {quiz.timer_minutes} Minutes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-slate-200"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Config
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] shadow-sm"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Quiz
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Question List */}
        <aside className="w-72 border-r border-slate-200 bg-white overflow-y-auto p-4 hidden md:block">
          <div className="space-y-2">
            {quiz.questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setActiveQuestion(i)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all border group",
                  activeQuestion === i 
                    ? "bg-blue-50 border-blue-200 ring-4 ring-blue-50" 
                    : "bg-white border-transparent hover:bg-slate-50 border-slate-100"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn(
                    "w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5",
                    activeQuestion === i ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <p className={cn(
                      "text-xs truncate font-medium",
                      activeQuestion === i ? "text-blue-700" : "text-slate-700"
                    )}>
                      {q.question || "Untitled Question"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">4 Options • Correct: {String.fromCharCode(65 + q.correct_answer)}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      removeQuestion(i)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))}
            <Button 
              variant="outline" 
              className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 h-12"
              onClick={addQuestion}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-3xl mx-auto py-8 px-6 space-y-8">
            {/* Quiz Info */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Quiz Title</Label>
                  <Input 
                    value={quiz.title}
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                    className="text-xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-slate-300"
                    placeholder="Enter quiz title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500">Description</Label>
                  <Textarea 
                    value={quiz.description}
                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                    className="resize-none border-none px-0 min-h-[60px] focus-visible:ring-0 text-slate-600"
                    placeholder="Briefly describe what this quiz covers..."
                  />
                </div>
              </div>
            </section>

            {/* Current Question */}
            <AnimatePresence mode="wait">
              <motion.section 
                key={activeQuestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-blue-500 font-mono">#{activeQuestion + 1}</span>
                    Edit Question
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" disabled={activeQuestion === 0} onClick={() => setActiveQuestion(activeQuestion - 1)}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled={activeQuestion === quiz.questions.length - 1} onClick={() => setActiveQuestion(activeQuestion + 1)}>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Question Text</Label>
                    <Textarea 
                      value={quiz.questions[activeQuestion].question}
                      onChange={(e) => updateQuestion("question", e.target.value)}
                      className="text-lg font-medium bg-slate-50 border-slate-100 rounded-xl p-4 focus:bg-white transition-all min-h-[100px]"
                      placeholder="Type your question here..."
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Options & Correct Answer</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quiz.questions[activeQuestion].options.map((opt, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "group relative flex items-center p-1 pl-4 rounded-xl border transition-all",
                            quiz.questions[activeQuestion].correct_answer === i 
                              ? "bg-green-50/50 border-green-200 ring-2 ring-green-100" 
                              : "bg-white border-slate-200 hover:border-blue-300"
                          )}
                        >
                          <span className="text-sm font-bold text-slate-400 mr-3">{String.fromCharCode(65 + i)}</span>
                          <Input 
                            value={opt}
                            onChange={(e) => updateOption(i, e.target.value)}
                            className="border-none bg-transparent focus-visible:ring-0 text-slate-700"
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          />
                          <button
                            onClick={() => updateQuestion("correct_answer", i)}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                              quiz.questions[activeQuestion].correct_answer === i
                                ? "bg-green-500 text-white shadow-sm"
                                : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                            )}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Info className="w-4 h-4" />
                      <Label className="font-semibold uppercase tracking-wider text-[10px]">Answer Explanation (Optional)</Label>
                    </div>
                    <Textarea 
                      value={quiz.questions[activeQuestion].explanation || ""}
                      onChange={(e) => updateQuestion("explanation", e.target.value)}
                      className="bg-slate-50 border-slate-100 rounded-xl focus:bg-white text-sm"
                      placeholder="Why is this answer correct?"
                    />
                  </div>
                </div>
              </motion.section>
            </AnimatePresence>
          </div>
        </main>

        {/* Right Sidebar - Config */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.aside 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 border-l border-slate-200 bg-white p-6 space-y-8 absolute right-0 top-0 bottom-0 shadow-2xl z-20"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 border-b-2 border-blue-500 pb-1">Quiz Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <Label className="font-semibold text-sm">Timer (Minutes)</Label>
                  </div>
                  <Input 
                    type="number"
                    value={quiz.timer_minutes}
                    onChange={(e) => setQuiz({ ...quiz, timer_minutes: parseInt(e.target.value) })}
                    className="bg-slate-50 border-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Auto-submits when time runs out.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Target className="w-4 h-4" />
                    <Label className="font-semibold text-sm">Passing Score (%)</Label>
                  </div>
                  <Select 
                    value={quiz.pass_percentage.toString()} 
                    onValueChange={(v) => setQuiz({ ...quiz, pass_percentage: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[40, 50, 60, 70, 80, 90, 100].map(v => (
                        <SelectItem key={v} value={v.toString()}>{v}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileQuestion className="w-4 h-4" />
                    <Label className="font-semibold text-sm">Max Attempts</Label>
                  </div>
                  <Select 
                    value={quiz.max_attempts.toString()} 
                    onValueChange={(v) => setQuiz({ ...quiz, max_attempts: parseInt(v) })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 0].map(v => (
                        <SelectItem key={v} value={v.toString()}>{v === 0 ? "Unlimited" : v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Footer */}
      <footer className="h-16 border-t border-slate-200 bg-white px-4 flex items-center justify-between md:hidden">
        <Button variant="outline" size="sm" onClick={() => addQuestion()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Q
        </Button>
        <span className="text-xs font-bold text-slate-500">
          Q{activeQuestion + 1} / {quiz.questions.length}
        </span>
        <Button onClick={handleSave} size="sm" className="bg-blue-600">
          Save Quiz
        </Button>
      </footer>
    </div>
  )
}
