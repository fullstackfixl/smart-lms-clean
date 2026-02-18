"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

import { VideoBackground } from "./video-background"

const stats = [
  { value: "500+", label: "Institutions" },
  { value: "2M+", label: "Students" },
  { value: "50K+", label: "Courses" },
  { value: "99.9%", label: "Uptime" },
]

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-20 flex items-center">
      {/* Background */}
      <VideoBackground />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-24 lg:px-8 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left - Typography */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Built for Institutes, Colleges & Schools
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl font-black uppercase leading-[0.95] tracking-tighter text-foreground md:text-6xl lg:text-7xl xl:text-8xl"
            >
              The Future
              <br />
              <span className="text-gradient-primary">of Learning</span>
              <br />
              is Here
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground"
            >
              The all-in-one platform your institution depends on. AI-powered courses,
              live classes, and the tools educators have been waiting for.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-primary px-8 text-primary-foreground hover:bg-primary/90 glow-primary text-base font-semibold"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#courses">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border bg-transparent px-8 text-foreground hover:bg-secondary text-base"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Explore Courses
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right - Stats Grid */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/80 p-8 backdrop-blur-sm"
              >
                <span className="text-3xl font-black text-primary md:text-4xl">{stat.value}</span>
                <span className="mt-2 text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bold Statement Cards - Dayos style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3"
        >
          {[
            {
              heading: "AI.",
              desc: "The technology transforming education. Auto-generated quizzes, smart recommendations, and predictive analytics for every student.",
            },
            {
              heading: "GAP.",
              desc: "The gap between traditional and digital learning. We bridge it with live classes, real-time collaboration, and engaging gamification.",
            },
            {
              heading: "CLOSED.",
              desc: "Real institutions. Real results. 500+ colleges and schools delivering courses that students actually complete.",
            },
          ].map((item) => (
            <div key={item.heading} className="bg-card p-8 lg:p-10">
              <h3 className="text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
                {item.heading}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
