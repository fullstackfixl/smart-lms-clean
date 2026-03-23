"use client"

import { useState } from 'react'

/**
 * UserAvatar — Renders a user's profile picture or a color-coded initial fallback.
 * Usage: <UserAvatar name="John Doe" src={user.profilePicture} size="md" />
 */

interface UserAvatarProps {
  name?: string | null
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs:  'w-6 h-6 text-[10px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-14 h-14 text-lg',
  xl:  'w-24 h-24 text-3xl',
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + (parts[parts.length - 1]?.charAt(0) || '')).toUpperCase()
}

function getAvatarColor(name?: string | null): string {
  const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
    'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500',
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function UserAvatar({ name, src, size = 'md', className = '' }: UserAvatarProps) {
  const [error, setError] = useState(false)
  const sizeClass = sizeMap[size]
  const initials = getInitials(name)
  const colorClass = getAvatarColor(name)

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      aria-label={name || 'User avatar'}
    >
      {initials}
    </div>
  )
}

export default UserAvatar
