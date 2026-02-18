import React from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-border bg-card p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Insta<span className="text-primary">tute</span>
          </span>
        </Link>
        <div>
          <blockquote className="max-w-md">
            <p className="text-lg leading-relaxed text-muted-foreground">
              &ldquo;Instatute transformed how we deliver education. The AI-powered features and seamless live class integration made our institution 10x more efficient.&rdquo;
            </p>
            <footer className="mt-4">
              <p className="text-sm font-semibold text-foreground">Dr. Sarah Chen</p>
              <p className="text-sm text-muted-foreground">Dean of Online Education, TechAcademy</p>
            </footer>
          </blockquote>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Instatute. All rights reserved.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Insta<span className="text-primary">tute</span>
            </span>
          </Link>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
