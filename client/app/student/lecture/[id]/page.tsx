"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"

const API_URL = 'http://localhost:5000'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Award,
  ChevronRight,
  ChevronLeft,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Question {
  index: number
  question: string
  options: string[]
  points: number
}

interface QuizAttempt {
  score: number
  passed: boolean
  attempt_number: number
  submitted_at: string
}

interface Lecture {
  _id: string
  title: string
  description: string
  type: 'video' | 'text' | 'pdf' | 'quiz'
  duration: number
  video_url?: string
  video_duration?: number
  text_content?: string
  pdf_url?: string
  questions?: Question[]
  passing_score?: number
  total_questions?: number
  quiz_attempts?: QuizAttempt[]
  best_score?: number
  quiz_available: boolean
  progress: {
    watched_seconds: number
    completion_percentage: number
    completed: boolean
    last_watched_at: string
  } | null
  next_lecture: { _id: string; title: string; type: string } | null
  previous_lecture: { _id: string; title: string; type: string } | null
}

export default function StudentLecturePage() {
  const params = useParams()
  const router = useRouter()
  const lectureId = params.id as string

  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [quizSubmitting, setQuizSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState<any>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchLecture()
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [lectureId])

  useEffect(() => {
    // Auto-save progress every 10 seconds
    if (playing && lecture?.type === 'video') {
      progressIntervalRef.current = setInterval(() => {
        saveProgress()
      }, 10000)
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [playing, currentTime])

  const fetchLecture = async () => {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const response = await fetch(`${API_URL}/student/lectures/${lectureId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setLecture(data.data)
        if (data.data.progress) {
          setCurrentTime(data.data.progress.watched_seconds)
        }
      } else {
        toast.error(data.message || 'Failed to load lecture')
      }
    } catch (error) {
      console.error('Fetch lecture error:', error)
      toast.error('Failed to load lecture')
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async () => {
    if (!lecture || lecture.type !== 'video') return

    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      await fetch(`${API_URL}/student/lectures/${lectureId}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          watched_seconds: Math.floor(currentTime)
        })
      })
    } catch (error) {
      console.error('Save progress error:', error)
    }
  }

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setPlaying(!playing)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      // Resume from last watched position
      if (lecture?.progress?.watched_seconds) {
        videoRef.current.currentTime = lecture.progress.watched_seconds
      }
    }
  }

  const handleVolumeChange = (value: number) => {
    setVolume(value)
    if (videoRef.current) {
      videoRef.current.volume = value
    }
  }

  const toggleMute = () => {
    setMuted(!muted)
    if (videoRef.current) {
      videoRef.current.muted = !muted
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const navigateToLecture = (lectureId: string) => {
    router.push(`/student/lecture/${lectureId}`)
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setSelectedAnswers(new Array(lecture?.questions?.length || 0).fill(-1))
    setQuizResult(null)
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[questionIndex] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const submitQuiz = async () => {
    if (selectedAnswers.some(a => a === -1)) {
      toast.error('Please answer all questions')
      return
    }

    setQuizSubmitting(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const response = await fetch(`${API_URL}/student/lectures/${lectureId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          answers: selectedAnswers
        })
      })

      const data = await response.json()

      if (data.success) {
        setQuizResult(data.data)
        toast.success(data.message)
        // Refresh lecture to update progress
        fetchLecture()
      } else {
        toast.error(data.message || 'Failed to submit quiz')
      }
    } catch (error) {
      console.error('Submit quiz error:', error)
      toast.error('Failed to submit quiz')
    } finally {
      setQuizSubmitting(false)
    }
  }

  const retakeQuiz = () => {
    setQuizStarted(true)
    setSelectedAnswers(new Array(lecture?.questions?.length || 0).fill(-1))
    setQuizResult(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  if (!lecture) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400">Lecture not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const completionPercentage = lecture.progress?.completion_percentage || 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Video Player Section */}
      {lecture.type === 'video' && lecture.video_url && (
        <div className="relative w-full bg-black">
          <div className="max-w-7xl mx-auto">
            {/* 16:9 Aspect Ratio Container */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <video
                ref={videoRef}
                src={lecture.video_url}
                className="absolute top-0 left-0 w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => {
                  setPlaying(false)
                  saveProgress()
                }}
              />

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <Progress 
                    value={(currentTime / duration) * 100} 
                    className="h-1 cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const percentage = x / rect.width
                      const newTime = percentage * duration
                      if (videoRef.current) {
                        videoRef.current.currentTime = newTime
                      }
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-300 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20"
                    >
                      {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                      >
                        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{lecture.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{lecture.duration} minutes</span>
                </div>
                {lecture.progress?.completed && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Your Progress</span>
              <span className="text-indigo-400 font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            {lecture.quiz_available && (
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h3 className="text-lg font-semibold mb-4">About this lecture</h3>
              <p className="text-slate-300 leading-relaxed">{lecture.description}</p>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card className="bg-slate-900/50 border-slate-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <p className="text-slate-400">No resources available for this lecture.</p>
            </Card>
          </TabsContent>

          {lecture.quiz_available && (
            <TabsContent value="quiz">
              <Card className="bg-slate-900/50 border-slate-800 p-6">
                {!quizStarted && !quizResult && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <Award className="w-6 h-6 text-indigo-400" />
                      <h3 className="text-lg font-semibold">Quiz</h3>
                    </div>
                    <p className="text-slate-300 mb-4">
                      Test your knowledge with a quiz on this lecture.
                    </p>
                    {lecture.quiz_attempts && lecture.quiz_attempts.length > 0 && (
                      <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-slate-400 mb-2">Previous Attempts:</p>
                        <div className="space-y-2">
                          {lecture.quiz_attempts.slice(0, 3).map((attempt, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>Attempt {attempt.attempt_number}</span>
                              <span className={attempt.passed ? 'text-emerald-400' : 'text-red-400'}>
                                {attempt.score}% {attempt.passed ? '✓' : '✗'}
                              </span>
                            </div>
                          ))}
                        </div>
                        {lecture.best_score && (
                          <p className="text-sm text-indigo-400 mt-2">Best Score: {lecture.best_score}%</p>
                        )}
                      </div>
                    )}
                    <Button onClick={startQuiz} className="bg-indigo-600 hover:bg-indigo-500">
                      {lecture.quiz_attempts && lecture.quiz_attempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                    </Button>
                  </>
                )}

                {quizStarted && !quizResult && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-indigo-400" />
                        <h3 className="text-lg font-semibold">Quiz</h3>
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        {lecture.total_questions} Questions
                      </Badge>
                    </div>

                    <div className="space-y-6 mb-6">
                      {lecture.questions?.map((question, qIdx) => (
                        <div key={qIdx} className="p-4 bg-slate-800/50 rounded-lg">
                          <p className="font-medium mb-4">
                            {qIdx + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => handleAnswerSelect(qIdx, oIdx)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                  selectedAnswers[qIdx] === oIdx
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <Button
                        onClick={submitQuiz}
                        disabled={quizSubmitting || selectedAnswers.some(a => a === -1)}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                      </Button>
                      <Button
                        onClick={() => setQuizStarted(false)}
                        variant="outline"
                        className="border-slate-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}

                {quizResult && (
                  <>
                    <div className="text-center mb-6">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                        quizResult.passed ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      }`}>
                        <span className={`text-3xl font-bold ${
                          quizResult.passed ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {quizResult.score}%
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {quizResult.passed ? 'Congratulations!' : 'Keep Trying!'}
                      </h3>
                      <p className="text-slate-400">
                        You scored {quizResult.correct_answers} out of {quizResult.total_questions} questions correctly
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Passing score: {quizResult.passing_score}%
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      {quizResult.answers.map((answer: any, idx: number) => (
                        <div key={idx} className={`p-4 rounded-lg border ${
                          answer.is_correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium">Question {idx + 1}</p>
                            {answer.is_correct ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-2">
                            Your answer: {lecture.questions?.[idx].options[answer.selected_answer]}
                          </p>
                          {!answer.is_correct && (
                            <p className="text-sm text-emerald-400">
                              Correct answer: {lecture.questions?.[idx].options[answer.correct_answer]}
                            </p>
                          )}
                          {answer.explanation && (
                            <p className="text-sm text-slate-400 mt-2 italic">
                              {answer.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={retakeQuiz} className="bg-indigo-600 hover:bg-indigo-500">
                        Retake Quiz
                      </Button>
                      <Button
                        onClick={() => setQuizResult(null)}
                        variant="outline"
                        className="border-slate-700"
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-800">
          {lecture.previous_lecture ? (
            <Button
              variant="outline"
              onClick={() => navigateToLecture(lecture.previous_lecture!._id)}
              className="border-slate-700 hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Lecture
            </Button>
          ) : (
            <div />
          )}

          {lecture.next_lecture && (
            <Button
              onClick={() => navigateToLecture(lecture.next_lecture!._id)}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              Next Lecture
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
