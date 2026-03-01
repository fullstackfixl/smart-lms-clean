"use client"

import { useState, use } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Play, Clock, Users, Star, BookOpen, CheckCircle,
  Lock, ChevronDown, ChevronRight, Video, FileText,
  Download, Award, ArrowLeft
} from "lucide-react"
import { Button } from '../../../../components/ui/button'
import Link from "next/link"

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const { id } = unwrappedParams
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <Link href="/dashboard/courses" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to courses
      </Link>
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Video className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Course Content Under Development</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        We are currently setting up the dynamic course player for this view.
        Real course content and progress tracking will be available soon.
      </p>
      <div className="pt-8">
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    </div>
  )
}
