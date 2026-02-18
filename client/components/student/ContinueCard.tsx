"use client"

import { motion } from "framer-motion"
import { Play, Clock, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ContinueCardProps {
  title: string
  instructor: string
  progress: number
  totalLessons: number
  completedLessons: number
  lastWatched?: string
  thumbnail?: string
  onContinue: () => void
}

export function ContinueCard({
  title,
  instructor,
  progress,
  totalLessons,
  completedLessons,
  lastWatched,
  thumbnail,
  onContinue
}: ContinueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800",
        "bg-black/50 backdrop-blur-md p-6",
        "transition-all duration-300",
        "hover:shadow-lg hover:shadow-orange-500/10 hover:border-slate-700"
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      
      {/* Content */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnail */}
          <div className="relative w-full lg:w-48 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex-shrink-0">
            {thumbnail ? (
              <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-orange-500/50" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-4">{instructor}</p>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <BookOpen className="w-4 h-4" />
                <span>{completedLessons}/{totalLessons} lessons</span>
              </div>
              {lastWatched && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Last watched: {lastWatched}</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">{progress}% Complete</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                />
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={onContinue}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300"
            >
              <Play className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
