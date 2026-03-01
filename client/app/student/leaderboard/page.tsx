"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, AlertCircle, Medal, Crown, Award } from "lucide-react"
import { EmptySection } from '../../../components/student/EmptySection'
import { Skeleton } from '../../../components/ui/skeleton'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { toast } from "sonner"
import { getLeaderboard } from '../../../lib/services/studentApi'
import { getInitials } from '../../../lib/utils'

interface LeaderboardEntry {
  _id: string
  student_id: {
    _id: string
    name: string
    email: string
  }
  total_points: number
  rank: number
  courses_completed: number
  badges_earned: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    setLoading(true)
    setError(null)
    try {
      const response = await getLeaderboard()
      
      if (response.success && response.data) {
        setLeaderboard(response.data.leaderboard || response.data)
        setCurrentUserRank(response.data.currentUserRank || null)
      } else {
        setError(response.message || "Failed to load leaderboard")
      }
    } catch (err: any) {
      console.error('Leaderboard error:', err)
      setError(err.response?.data?.message || "Network error occurred")
      toast.error("Failed to load leaderboard")
    } finally {
      setLoading(false)
    }
  }

  function getRankIcon(rank: number) {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />
      case 2:
        return <Medal className="h-6 w-6 text-slate-400" />
      case 3:
        return <Medal className="h-6 w-6 text-orange-400" />
      default:
        return null
    }
  }

  function getRankColor(rank: number) {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
      case 2:
        return 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 border-slate-500/30'
      case 3:
        return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/30'
      default:
        return 'bg-black/50 border-slate-700/50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-12">
        <div>
          <Skeleton className="h-16 w-96 bg-slate-800/50 mb-4" />
          <Skeleton className="h-6 w-64 bg-slate-800/50" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 bg-slate-800/50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold text-white mb-3">Leaderboard</h1>
          <p className="text-xl text-slate-300">See how you rank among other learners</p>
        </motion.div>

        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unable to Load Leaderboard</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={loadLeaderboard}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl font-bold text-white mb-3">Leaderboard</h1>
        <p className="text-xl text-slate-300">See how you rank among other learners</p>
      </motion.div>

      {leaderboard.length === 0 ? (
        <EmptySection
          icon={Trophy}
          title="No rankings yet"
          description="Complete courses and earn points to appear on the leaderboard"
        />
      ) : (
        <>
          {/* Current User Rank Card */}
          {currentUserRank && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-md border border-orange-500/30 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Your Current Rank</p>
                    <p className="text-3xl font-bold text-white">#{currentUserRank}</p>
                  </div>
                </div>
                <Award className="h-12 w-12 text-orange-500/30" />
              </div>
            </motion.div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                className={`rounded-2xl backdrop-blur-md border p-6 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 ${getRankColor(entry.rank)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      {getRankIcon(entry.rank) || (
                        <span className="text-2xl font-bold text-slate-400">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-14 w-14 border-2 border-slate-700">
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold">
                        {getInitials(entry.student_id.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">
                        {entry.student_id.name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {entry.courses_completed} courses completed • {entry.badges_earned} badges
                      </p>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="text-3xl font-bold text-orange-400">
                      {entry.total_points}
                    </p>
                    <p className="text-sm text-slate-400">points</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
