import React from 'react'

export function Section({
  children,
  fullBleed = false,
  className = '',
}: {
  children: React.ReactNode
  fullBleed?: boolean
  className?: string
}) {
  return (
    <section
      className={`py-20 ${fullBleed ? 'w-full px-0' : 'max-w-7xl mx-auto px-20'} ${className}`}
    >
      {children}
    </section>
  )
}
