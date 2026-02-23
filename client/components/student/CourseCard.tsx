"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { BookOpen, Clock, Users, Star, PlayCircle, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
    price?: number
}

interface CourseCardProps {
    course: CourseCardData
    variant: "enrolled" | "available"
    onEnroll?: (id: string) => void
    enrolling?: boolean
}

export default function CourseCard({ course, variant, onEnroll, enrolling }: CourseCardProps) {
    const router = useRouter()
    const pct = course.completionPercentage ?? course.progress ?? 0
    const instructor = course.instructor_id?.name || course.instructor?.name || "Instructor"
    const thumb = course.thumbnail || "/placeholder-course.svg"

    const handleContinue = () => router.push(`/student/course/${course._id}`)

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="h-full"
        >
            <Card className="h-full flex flex-col overflow-hidden border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 group">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-50 overflow-hidden">
                    {course.thumbnail ? (
                        <img
                            src={thumb}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-50">
                            <BookOpen className="h-10 w-10 text-[#4CAF50]/30" />
                        </div>
                    )}

                    {/* Floating Price/Status Badge */}
                    <div className="absolute top-3 right-3">
                        {variant === "enrolled" ? (
                            <Badge className={cn(
                                "border-0 shadow-sm font-bold text-xs",
                                pct === 100 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                            )}>
                                {pct === 100 ? "Completed" : "In Progress"}
                            </Badge>
                        ) : (
                            <Badge className="bg-[#4CAF50] text-white border-0 shadow-sm font-bold text-xs">
                                {course.price === 0 || !course.price ? "Free" : `₹${course.price}`}
                            </Badge>
                        )}
                    </div>
                </div>

                <CardContent className="flex flex-col flex-1 p-5">
                    {/* Category */}
                    {course.category && (
                        <p className="text-[10px] font-bold text-[#4CAF50] uppercase tracking-wider mb-1">
                            {course.category}
                        </p>
                    )}

                    {/* Title */}
                    <h3 className="font-bold text-slate-800 leading-snug line-clamp-2 text-base group-hover:text-[#4CAF50] transition-colors mb-2">
                        {course.title}
                    </h3>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                            <Users className="h-3 w-3 text-slate-400" />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{instructor}</span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 mt-auto">
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />{course.duration || 0} mins
                        </span>
                        {course.rating && course.rating.average > 0 && (
                            <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-[#FFC107] fill-[#FFC107]" />
                                <span className="font-bold text-slate-700">{course.rating.average.toFixed(1)}</span>
                            </span>
                        )}
                    </div>

                    {/* Progress or Enroll CTA */}
                    <div className="space-y-3">
                        {variant === "enrolled" ? (
                            <>
                                <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="text-slate-500 font-medium">Course Progress</span>
                                    <span className="font-bold text-[#4CAF50]">{Math.round(pct)}%</span>
                                </div>
                                <Progress value={pct} className="h-1.5 bg-slate-100" />
                                <Button
                                    onClick={handleContinue}
                                    className="w-full mt-2 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-10 gap-2 shadow-sm"
                                >
                                    {pct === 100 ? "View Lessons" : <><PlayCircle className="h-4 w-4" /> Continue Learning</>}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={() => onEnroll?.(course._id)}
                                disabled={enrolling}
                                className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-10 gap-2 shadow-sm"
                            >
                                {enrolling ? "Enrolling..." : "Enroll Now"}
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
