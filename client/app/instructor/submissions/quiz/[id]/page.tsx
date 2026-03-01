"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    User,
    Calendar,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Award,
    Loader2
} from "lucide-react"
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card'
import { Badge } from '../../../../../components/ui/badge'
import { Progress } from '../../../../../components/ui/progress'
import { toast } from "sonner"
import { API_URL } from '../../../../../lib/config'

interface DetailedAnswer {
    questionIndex: number
    selectedOption: number
    isCorrect: boolean
    questionText: string
    options: string[]
    correctAnswer: number
    explanation?: string
}

interface SubmissionDetail {
    _id: string
    studentId: {
        name: string
        email: string
        profile?: { avatar?: string }
    }
    quizId: {
        title: string
        pass_percentage: number
    }
    courseId: {
        title: string
    }
    score: number
    totalMarks: number
    percentage: number
    attemptNumber: number
    passed: boolean
    submittedAt: string
    answers: DetailedAnswer[]
}

export default function InstructorQuizReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()
    const submissionId = unwrappedParams.id

    const [loading, setLoading] = useState(true)
    const [submission, setSubmission] = useState<SubmissionDetail | null>(null)

    useEffect(() => {
        fetchSubmissionDetail()
    }, [submissionId])

    const fetchSubmissionDetail = async () => {
        setLoading(true)
        try {
            const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
            if (!token) {
                router.push('/login')
                return
            }

            const response = await fetch(`${API_URL}/api/instructor/quiz-submissions/${submissionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await response.json()
            if (data.success) {
                setSubmission(data.data.submission)
            } else {
                toast.error(data.message || 'Failed to load submission details')
                router.push('/instructor/submissions')
            }
        } catch (error) {
            toast.error('Error loading submission review')
            router.back()
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!submission) return null

    return (
        <div className="min-h-screen bg-muted/30 p-4 md:p-8 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-2">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Submissions
                </Button>

                {/* Overview Header */}
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl font-bold mb-1">{submission.quizId.title}</CardTitle>
                                    <CardDescription>Course: {submission.courseId.title}</CardDescription>
                                </div>
                                <Badge variant={submission.passed ? "default" : "destructive"} className="text-sm px-4 py-1">
                                    {submission.passed ? "PASSED" : "FAILED"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6 py-4 border-t border-b mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        {submission.studentId.profile?.avatar ? (
                                            <img src={submission.studentId.profile.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <User className="h-6 w-6 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold">{submission.studentId.name}</p>
                                        <p className="text-xs text-muted-foreground">{submission.studentId.email}</p>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-border hidden sm:block" />
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Submitted On
                                    </p>
                                    <p className="text-sm font-medium">{new Date(submission.submittedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Score</p>
                                    <p className="text-xl font-bold">{submission.score}/{submission.totalMarks}</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Percentage</p>
                                    <p className="text-xl font-bold">{submission.percentage}%</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Attempt</p>
                                    <p className="text-xl font-bold">#{submission.attemptNumber}</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Pass Mark</p>
                                    <p className="text-xl font-bold">{submission.quizId.pass_percentage}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col items-center justify-center text-center p-6 bg-primary text-primary-foreground">
                        <Award className="h-16 w-16 mb-4 opacity-80" />
                        <h3 className="text-3xl font-bold mb-1">{submission.percentage}%</h3>
                        <p className="text-primary-foreground/80 mb-4 font-medium">Auto-Graded Result</p>
                        <div className="w-full bg-primary-foreground/20 rounded-full h-2 mb-4">
                            <div
                                className="bg-white h-full rounded-full"
                                style={{ width: `${submission.percentage}%` }}
                            />
                        </div>
                        <p className="text-sm italic">
                            Student {submission.passed ? 'met' : 'did not meet'} the passing requirement.
                        </p>
                    </Card>
                </div>

                {/* Detailed Question Review */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" /> Question Breakdown
                    </h2>

                    {submission.answers.map((answer, idx) => (
                        <Card key={idx} className={`shadow-sm border-l-4 ${answer.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-start gap-4">
                                    <span className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${answer.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}>
                                        {idx + 1}
                                    </span>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-lg">{answer.questionText}</p>
                                    </div>
                                    {answer.isCorrect ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pl-16 space-y-3">
                                <div className="grid gap-2">
                                    {answer.options.map((opt, optIdx) => (
                                        <div
                                            key={optIdx}
                                            className={`p-3 rounded-lg text-sm border flex justify-between items-center ${optIdx === answer.correctAnswer
                                                    ? "bg-green-50 border-green-200 text-green-800"
                                                    : optIdx === answer.selectedOption && !answer.isCorrect
                                                        ? "bg-red-50 border-red-200 text-red-800"
                                                        : "bg-background border-muted"
                                                }`}
                                        >
                                            <span>{opt}</span>
                                            <div className="flex gap-2">
                                                {optIdx === answer.correctAnswer && (
                                                    <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">Correct Answer</Badge>
                                                )}
                                                {optIdx === answer.selectedOption && (
                                                    <Badge variant="outline" className={answer.isCorrect ? "bg-green-200 border-green-400" : "bg-red-200 border-red-400"}>
                                                        Student Selection
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {answer.explanation && (
                                    <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm">
                                        <p className="font-bold text-muted-foreground mb-1 text-xs uppercase tracking-widest">Explanation</p>
                                        <p>{answer.explanation}</p>
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
