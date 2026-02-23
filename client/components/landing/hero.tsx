"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Building2, GraduationCap, Trophy } from "lucide-react"
import { VideoBackground } from "./video-background"

interface Stats {
  totalPublicCourses: number
  totalPublicStudents: number
  totalOrganizations: number
  coursesCompleted: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function StatCard({
  icon: Icon,
  value,
  label,
  delay,
}: {
  icon: React.ElementType
  value: string
  label: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center"
      style={{
        background: "rgba(13,20,38,0.85)",
        border: "1px solid rgba(255,153,0,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "rgba(255,153,0,0.15)" }}
      >
        <Icon className="h-5 w-5" style={{ color: "#FF9900" }} />
      </div>
      <span className="text-2xl font-black text-white md:text-3xl">{value}</span>
      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
        {label}
      </span>
    </motion.div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K+`
  if (n > 0) return `${n}+`
  return "—"
}

export function Hero() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [ctaLoading, setCtaLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`${API_URL}/api/public/stats`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data)
      })
      .catch(() => {
        // silently fail – show placeholders
      })
  }, [])

  const statCards = [
    {
      icon: Building2,
      value: stats ? formatNumber(stats.totalOrganizations) : "—",
      label: "Institutes & Schools",
      delay: 0.4,
    },
    {
      icon: GraduationCap,
      value: stats ? formatNumber(stats.totalPublicStudents) : "—",
      label: "Active Students",
      delay: 0.5,
    },
    {
      icon: BookOpen,
      value: stats ? formatNumber(stats.totalPublicCourses) : "—",
      label: "Published Courses",
      delay: 0.6,
    },
    {
      icon: Trophy,
      value: stats ? formatNumber(stats.coursesCompleted) : "—",
      label: "Courses Completed",
      delay: 0.7,
    },
  ]

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "#0A0F1E" }}
    >
      {/* Video Background – 3 rotating Cloudinary videos */}
      <VideoBackground />

      {/* Dark navy overlay on top of video */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,15,30,0.72) 0%, rgba(10,15,30,0.55) 50%, rgba(10,15,30,0.80) 100%)",
        }}
      />
      {/* Subtle orange glow at bottom */}
      <div
        className="absolute bottom-0 left-1/2 z-10 h-64 w-full -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,153,0,0.14) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 pt-28 pb-20 lg:px-8 lg:pt-36 lg:pb-28">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
          style={{
            background: "rgba(255,153,0,0.12)",
            border: "1px solid rgba(255,153,0,0.3)",
            color: "#FF9900",
          }}
        >
          Built for Institutes, Colleges &amp; Schools
          <ArrowRight className="h-3.5 w-3.5" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="max-w-3xl text-5xl font-black uppercase leading-[0.92] tracking-tighter text-white md:text-6xl lg:text-7xl xl:text-8xl"
        >
          The Future
          <br />
          <span className="lp-gradient-text">of Learning</span>
          <br />
          is Here
        </motion.h1>

        {/* Sub-heading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="mt-7 max-w-lg text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Build scalable, AI-powered education platforms for institutes and coaching centers.
          Everything you need — live classes, gamification, certifications — in one place.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.3 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #FF9900, #e68a00)",
              boxShadow: "0 8px 32px rgba(255,153,0,0.4)",
            }}
            onClick={(e) => {
              e.preventDefault()
              if (ctaLoading) return
              setCtaLoading(true)
              setTimeout(() => {
                setCtaLoading(false)
                router.push("/apply")
              }, 2000)
            }}
            onMouseEnter={(e) => {
              ; (e.currentTarget as HTMLElement).style.boxShadow =
                "0 12px 40px rgba(255,153,0,0.6)"
                ; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(e) => {
              ; (e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 32px rgba(255,153,0,0.4)"
                ; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
            }}
          >
            {ctaLoading ? "Loading..." : "Start Free Trial"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#courses"
            className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-medium text-white transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              ; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"
                ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.4)"
            }}
            onMouseLeave={(e) => {
              ; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"
                ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"
            }}
          >
            Explore Courses
          </Link>
        </motion.div>

        {/* Real Stats Grid */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* AI.GAP.CLOSED. Strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-16 grid overflow-hidden rounded-2xl md:grid-cols-3"
          style={{ border: "1px solid rgba(255,153,0,0.18)" }}
        >
          {[
            {
              heading: "AI.",
              desc: "Auto-generated quizzes, smart analytics, and predictive insights for every student.",
            },
            {
              heading: "GAP.",
              desc: "Bridge traditional and live classes with engaging gamification and real-time collaboration.",
            },
            {
              heading: "CLOSED.",
              desc: "Secure, isolated data for schools delivering certifications students are proud to share.",
            },
          ].map((item, i) => (
            <div
              key={item.heading}
              className="p-8 lg:p-10"
              style={{
                background: i === 1 ? "rgba(255,153,0,0.05)" : "rgba(13,20,38,0.8)",
                borderRight: i < 2 ? "1px solid rgba(255,153,0,0.12)" : "none",
              }}
            >
              <h3
                className="text-3xl font-black uppercase tracking-tight md:text-4xl"
                style={{ color: "#FF9900" }}
              >
                {item.heading}
              </h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
