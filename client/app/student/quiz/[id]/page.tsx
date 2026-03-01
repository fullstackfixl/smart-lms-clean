"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Clock,
    ChevronRight,
    ChevronLeft,
    Send,
    AlertCircle,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Trophy,
    ArrowLeft,
    Loader2
} from "lucide-react"
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Progress } from '../../../../components/ui/progress'
import { toast } from "sonner"
import { API_URL } from '../../../../lib/config'

interface Question {
    question: string
    options: string[]
}

interface QuizData {
    _id: string
    title: string
    description: string
    timer_minutes: number
    totalMarks: number
    questions: Question[]
    attemptNumber: number
}

interface ResultData {
    score: number
    totalMarks: number
    percentage: number
    passed: boolean
    attemptNumber: number
    results: {
        questionIndex: number
        selectedOption: number
        isCorrect: boolean
        explanation: string
        correctAnswer: number
    }[]
}

export default function QuizAttemptPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()
    const quizId = unwrappedParams.id

    const [loading, setLoading] = useState(true)
    const [quiz, setQuiz] = useState<QuizData | null>(null)
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
    const [answers, setAnswers] = useState<number[]>([])
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<ResultData | null>(null)

    useEffect(() => {
        fetchQuiz()
    }, [quizId])

    useEffect(() => {
        if (timeLeft > 0 && !result && !isSubmitting) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        handleSubmit()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [timeLeft, result, isSubmitting])

    const fetchQuiz = async () => {
        setLoading(true)
        try {
            const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
            if (!token) {
                toast.error('Please login first')
                router.push('/login')
                return
            }

            const response = await fetch(`${API_URL}/student/quiz/${quizId}/start`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            const data = await response.json()
            if (data.success) {
                setQuiz(data.data.quiz)
                setAnswers(new Array(data.data.quiz.questions.length).fill(-1))
                setTimeLeft(data.data.quiz.timer_minutes * 60)
            } else {
                toast.error(data.message || 'Failed to start quiz')
                router.push('/student/dashboard')
            }
        } catch (error) {
            toast.error('Failed to load quiz')
            router.back()
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOption = (optionIdx: number) => {
        if (result) return
        const newAnswers = [...answers]
        newAnswers[currentQuestionIdx] = optionIdx
        setAnswers(newAnswers)
    }

    const handleSubmit = async () => {
        if (isSubmitting || result) return
        setIsSubmitting(true)

        try {
            const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
            const response = await fetch(`${API_URL}/student/quiz/${quizId}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers }),
                credentials: 'include'
            })

            const data = await response.json()
            if (data.success) {
                setResult(data.data.submission)
                toast.success('Quiz submitted successfully!')
            } else {
                toast.error(data.message || 'Failed to submit quiz')
            }
        } catch (error) {
            toast.error('Submission failed. Please check your connection.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!quiz) return null

    if (result) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Card className={`${result.passed ? 'border-green-500' : 'border-red-500'} border-2`}>
                        <CardHeader className="text-center pb-2">
                            <div className="flex justify-center mb-4">
                                {result.passed ? (
                                    <Trophy className="h-16 w-16 text-yellow-500" />
                                ) : (
                                    <AlertCircle className="h-16 w-16 text-red-500" />
                                )}
                            </div>
                            <CardTitle className="text-3xl">
                                {result.passed ? 'Congratulations!' : 'Quiz Completed'}
                            </CardTitle>
                            <CardDescription className="text-lg">
                                You scored {result.score} out of {result.totalMarks} ({result.percentage}%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center gap-4 mb-6">
                                <Badge variant={result.passed ? "default" : "destructive"} className="text-lg px-6">
                                    {result.passed ? 'PASSED' : 'FAILED'}
                                </Badge>
                                <Badge variant="outline" className="text-lg px-6">
                                    Attempt #{result.attemptNumber}
                                </Badge>
                            </div>
                            <Progress value={result.percentage} className={`h-3 ${result.passed ? 'bg-green-100' : 'bg-red-100'}`} />
                        </CardContent>
                        <CardFooter className="flex justify-center gap-4">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" /> back to course
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">Review Your Answers</h3>
                        {result.results.map((qResult, idx) => (
                            <Card key={idx} className={qResult.isCorrect ? "border-green-200" : "border-red-200"}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            {qResult.isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg">{quiz.questions[idx].question}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-14">
                                    <div className="space-y-2">
                                        {quiz.questions[idx].options.map((opt, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className={`p-3 rounded-lg text-sm border ${optIdx === qResult.correctAnswer
                                                        ? "bg-green-50 border-green-200 text-green-800"
                                                        : optIdx === qResult.selectedOption && !qResult.isCorrect
                                                            ? "bg-red-50 border-red-200 text-red-800"
                                                            : "border-transparent"
                                                    }`}
                                            >
                                                {opt}
                                                {optIdx === qResult.correctAnswer && <span className="ml-2 font-bold">(Correct)</span>}
                                                {optIdx === qResult.selectedOption && !qResult.isCorrect && <span className="ml-2 font-bold">(Your Answer)</span>}
                                            </div>
                                        ))}
                                    </div>
                                    {qResult.explanation && (
                                        <div className="mt-4 p-4 bg-muted rounded-lg text-sm italic">
                                            <span className="font-bold not-italic mr-2">Explanation:</span>
                                            {qResult.explanation}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const currentQuestion = quiz.questions[currentQuestionIdx]
    const completedCount = answers.filter(a => a !== -1).length
    const progressPercent = (completedCount / quiz.questions.length) * 100

    return (
        <div className="min-h-screen bg-muted/30 p-4 md:p-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Header with Timer */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-4 rounded-xl shadow-sm border">
                    <div>
                        <h1 className="text-xl font-bold">{quiz.title}</h1>
                        <p className="text-sm text-muted-foreground">Attempt #{quiz.attemptNumber}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-6 py-2 rounded-full font-mono text-xl ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary/10 text-primary'
                        }`}>
                        <Clock className="h-5 w-5" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <span>Progress: {completedCount}/{quiz.questions.length} answered</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                </div>

                <div className="grid md:grid-cols-4 gap-6 items-start">
                    {/* Question Navigator */}
                    <Card className="md:col-span-1 hidden md:block">
                        <CardHeader className="p-4">
                            <CardTitle className="text-sm">Navigation</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-4 gap-2">
                                {quiz.questions.map((_, idx) => (
                                    <Button
                                        key={idx}
                                        variant={currentQuestionIdx === idx ? "default" : answers[idx] !== -1 ? "secondary" : "outline"}
                                        className="h-8 w-8 p-0 text-xs"
                                        onClick={() => setCurrentQuestionIdx(idx)}
                                    >
                                        {idx + 1}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Question Area */}
                    <div className="md:col-span-3 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIdx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="shadow-lg border-t-4 border-t-primary">
                                    <CardHeader>
                                        <div className="flex justify-between items-center mb-2">
                                            <Badge variant="outline">Question {currentQuestionIdx + 1}</Badge>
                                        </div>
                                        <CardTitle className="text-xl leading-relaxed">
                                            {currentQuestion.question}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {currentQuestion.options.map((option, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleSelectOption(idx)}
                                                className={`group relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${answers[currentQuestionIdx] === idx
                                                        ? "border-primary bg-primary/5 shadow-md"
                                                        : "border-muted hover:border-primary/50 hover:bg-muted/50"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center h-10 w-10 rounded-lg mr-4 text-sm font-bold transition-colors ${answers[currentQuestionIdx] === idx
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground group-hover:bg-primary/20"
                                                    }`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <span className="flex-grow font-medium">{option}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-between items-center bg-background p-4 rounded-xl shadow-sm border">
                            <Button
                                variant="outline"
                                disabled={currentQuestionIdx === 0}
                                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                            </Button>

                            {currentQuestionIdx === quiz.questions.length - 1 ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || answers.includes(-1)}
                                    className="px-8 shadow-lg shadow-primary/20"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    {answers.includes(-1) ? 'Finish All to Submit' : 'Submit Quiz'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
