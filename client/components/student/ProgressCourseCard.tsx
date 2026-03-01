"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Clock, BookOpen } from "lucide-react"
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { cn } from '../../lib/utils'

interface ProgressCourseCardProps {
  title: string
  instructor: string
  thumbnail?: string
  progress: number
  totalLessons: number
  completedLessons: number
  lastWatched?: string
  onContinue: () => void
  delay?: number
}

export function ProgressCourseCard({
  title,
  instructor,
  thumbnail,
  progress,
  totalLessons,
  completedLessons,
  lastWatched,
  onContinue,
  delay = 0,
}: ProgressCourseCardProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, delay + 300)
    return () => clearTimeout(timer)
  }, [progress, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300">
        {/* Gradient Top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-orange-600" />

        <div className="p-6">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "h-24 w-24 rounded-2xl overflow-hidden",
                !thumbnail && "bg-gradient-to-br from-orange-400 to-orange-600"
              )}>
                {thumbnail ? (
                  <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-white" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                by {instructor}
              </p>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {animatedProgress}% Complete
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {completedLessons}/{totalLessons} lessons
                  </span>
                </div>
                <Progress 
                  value={animatedProgress} 
                  className="h-2 bg-gray-200 dark:bg-slate-700"
                  indicatorClassName="bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 ease-out"
                />
              </div>

              {lastWatched && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last watched: {lastWatched}</span>
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <Button
            onClick={onContinue}
            className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300"
          >
            <Play className="h-4 w-4 mr-2 fill-white" />
            Continue Learning
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
