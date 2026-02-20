"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { PlayCircle, ChevronRight, BookOpen, Clock, Users, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ProgressRing } from "./ProgressRing"
import Image from "next/image"

export interface CourseCardData {
    _id: string
    title: string
    description?: string
    thumbnail?: string
    instructor_id?: { _id?: string; name: string }
    instructor?: { name: string }
    category?: string
    duration?: number
    rating?: { average: number; count: number }
    progress?: number
    status?: "enrolled" | "in_progress" | "completed"
    isEnrolled?: boolean
    enrolledAt?: string
    completionPercentage?: number
}

interface CourseCardProps {
    course: CourseCardData
    variant: "enrolled" | "available"
    onEnroll?: (id: string) => void
    enrolling?: boolean
}

const progressColor = (pct: number) => {
    if (pct >= 70) return "#22c55e"
    if (pct >= 40) return "#f59e0b"
    return "#ef4444"
}

export default function CourseCard({ course, variant, onEnroll, enrolling }: CourseCardProps) {
    const router = useRouter()
    const pct = course.completionPercentage ?? course.progress ?? 0
    const instructor = course.instructor_id?.name || course.instructor?.name || "Instructor"
    const rating = course.rating?.average ?? 0
    const thumb = course.thumbnail || "/placeholder-course.svg"

    const handleContinue = () => router.push(`/student/course/${course._id}`)

    return (
        <motion.div
            whileHover={{ scale: 1.025, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col overflow-hidden border border-slate-800 bg-slate-900/80 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
                {/* Thumbnail */}
                <div className="relative overflow-hidden aspect-video bg-slate-800">
                    {course.thumbnail ? (
                        <img
                            src={thumb}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
                            <BookOpen className="h-12 w-12 text-purple-400/50" />
                        </div>
                    )}

                    {/* Category badge */}
                    {course.category && (
                        <div className="absolute top-2 left-2">
                            <Badge className="bg-black/60 backdrop-blur-sm text-white border-0 text-xs">
                                {course.category}
                            </Badge>
                        </div>
                    )}

                    {/* Completion ring overlay for enrolled */}
                    {variant === "enrolled" && (
                        <div className="absolute top-2 right-2">
                            <ProgressRing
                                percentage={pct}
                                size={44}
                                strokeWidth={4}
                                color={progressColor(pct)}
                            />
                        </div>
                    )}

                    {/* Free badge for available */}
                    {variant === "available" && (
                        <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500/90 text-white border-0 text-xs">Free</Badge>
                        </div>
                    )}
                </div>

                <CardContent className="flex flex-col flex-1 p-4 gap-3">
                    {/* Rating */}
                    {rating > 0 && (
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                            ))}
                            <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>
                            {course.rating?.count && <span className="text-xs text-slate-500">({course.rating.count})</span>}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-white leading-tight line-clamp-2 text-sm md:text-base group-hover:text-purple-300 transition-colors">
                        {course.title}
                    </h3>

                    {/* Description (available only) */}
                    {variant === "available" && course.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 flex-1">{course.description}</p>
                    )}

                    {/* Instructor + duration */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />{instructor}
                        </span>
                        {course.duration && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />{course.duration} min
                            </span>
                        )}
                    </div>

                    {/* Progress bar for enrolled */}
                    {variant === "enrolled" && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Progress</span>
                                <span style={{ color: progressColor(pct) }} className="font-semibold">{Math.round(pct)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${progressColor(pct)}99, ${progressColor(pct)})` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA Button */}
                    <div className="mt-auto pt-1">
                        {variant === "enrolled" ? (
                            <Button
                                size="sm"
                                onClick={handleContinue}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 gap-1.5"
                                aria-label={pct === 100 ? `View certificate for ${course.title}` : `Continue ${course.title}`}
                            >
                                {pct === 100 ? (
                                    <>🏆 View Certificate</>
                                ) : (
                                    <><PlayCircle className="h-3.5 w-3.5" />Continue<ChevronRight className="h-3 w-3 ml-auto" /></>
                                )}
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => onEnroll?.(course._id)}
                                disabled={enrolling}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 relative overflow-hidden"
                                aria-label={`Enroll in ${course.title}`}
                            >
                                {enrolling ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Enrolling...
                                    </span>
                                ) : (
                                    "Enroll Now"
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
