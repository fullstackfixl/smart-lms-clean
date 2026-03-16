"use client"

import { motion } from "framer-motion"
import { Sun, Moon, Monitor, Bell, Lock, User, Globe } from "lucide-react"
import { useTheme } from "next-themes"
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    { value: 'dark', label: 'Dark Mode', icon: Moon, description: 'Easy on the eyes (default)' },
    { value: 'light', label: 'Light Mode', icon: Sun, description: 'Clean and bright' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system settings' },
  ]

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-6xl font-bold text-slate-900 mb-3">
          Settings
        </h1>
        <p className="text-xl text-slate-600">
          Customize your learning experience
        </p>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          Appearance
        </h2>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Theme
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Choose how Instatute looks to you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = theme === option.value

                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "relative p-6 rounded-2xl border-2 transition-all duration-300 text-left",
                      isActive
                        ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                        : "border-gray-200 bg-slate-50 hover:border-orange-500/50"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
                      isActive
                        ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                        : "bg-gray-100 text-slate-600"
                    )}>
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <h4 className={cn(
                      "text-base font-semibold mb-1",
                      isActive
                        ? "text-orange-600"
                        : "text-slate-900"
                    )}>
                      {option.label}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {option.description}
                    </p>
                    {isActive && (
                      <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          Notifications
        </h2>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-blue-400" strokeWidth={1.5} />
                </div>
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-semibold text-slate-900">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-slate-600">
                    Receive updates about your courses
                  </p>
                </div>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-600/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-green-400" strokeWidth={1.5} />
                </div>
                <div>
                  <Label htmlFor="push-notifications" className="text-base font-semibold text-slate-900">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-slate-600">
                    Get notified about live classes
                  </p>
                </div>
              </div>
              <Switch id="push-notifications" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6">
          Account
        </h2>
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start h-auto p-4 border-gray-200 bg-white hover:bg-slate-50 hover:border-orange-500/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-600/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-400" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold text-slate-900">
                    Edit Profile
                  </p>
                  <p className="text-sm text-slate-600">
                    Update your personal information
                  </p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4 border-gray-200 bg-white hover:bg-slate-50 hover:border-orange-500/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-600/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-red-400" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold text-slate-900">
                    Change Password
                  </p>
                  <p className="text-sm text-slate-600">
                    Update your password
                  </p>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4 border-gray-200 bg-white hover:bg-slate-50 hover:border-orange-500/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-teal-600/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-teal-400" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold text-slate-900">
                    Language & Region
                  </p>
                  <p className="text-sm text-slate-600">
                    English (US)
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
