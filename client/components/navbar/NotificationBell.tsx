"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, Video, Award, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { ScrollArea } from '../../components/ui/scroll-area'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../../lib/utils'

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'live_class_reminder':
      case 'live_class_started':
        return <Video className="h-4 w-4 text-orange-500" />
      case 'certificate_issued':
        return <Award className="h-4 w-4 text-yellow-500" />
      case 'high_risk_alert':
      case 'medium_risk_alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Sparkles className="h-4 w-4 text-indigo-500" />
    }
  }

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId)
    }
  }

  const latestNotifications = notifications.slice(0, 5)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-300"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-[10px] font-bold text-white shadow-lg shadow-orange-500/50"
              >
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 p-0 bg-slate-900/95 backdrop-blur-md border-slate-800/50 shadow-2xl shadow-black/50"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/50 p-4">
            <div>
              <h3 className="font-bold text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : latestNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full" />
                  <Bell className="relative h-12 w-12 text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-300">All caught up!</p>
                <p className="text-xs text-slate-500 mt-1">No new notifications</p>
              </div>
            ) : (
              <div className="p-2">
                {latestNotifications.map((notification, index) => {
                  const isUnread = !notification.channels.in_app.read

                  return (
                    <motion.button
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification._id, notification.channels.in_app.read)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-all duration-300 group',
                        isUnread
                          ? 'bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/20'
                          : 'hover:bg-slate-800/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                          isUnread
                            ? 'bg-orange-500/10 border border-orange-500/20'
                            : 'bg-slate-800/50 border border-slate-700/50'
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={cn(
                              'text-sm font-semibold line-clamp-1',
                              isUnread ? 'text-slate-100' : 'text-slate-300'
                            )}>
                              {notification.title}
                            </h4>
                            {isUnread && (
                              <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                            )}
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>

                            {notification.sender_id && (
                              <span className="text-xs text-slate-500">
                                from {notification.sender_id.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {latestNotifications.length > 0 && (
            <div className="border-t border-slate-800/50 p-3">
              <Button
                variant="ghost"
                className="w-full text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              >
                View all notifications
              </Button>
            </div>
          )}
        </motion.div>
      </PopoverContent>
    </Popover>
  )
}
