"use client"

import { motion } from "framer-motion"
import {
  Brain, Video, BookOpen, Award, BarChart3, Gamepad2,
  Users, Calendar, CreditCard, Shield, Globe, MessageCircle,
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    desc: "Auto-generated quizzes, smart recommendations, topic explanations, and predictive analytics for every student.",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    icon: Video,
    title: "Live Classes",
    desc: "Integrated Jitsi Meet video conferencing with auto-attendance, recording uploads, and scheduling.",
    color: "text-accent bg-accent/10 border-accent/20",
  },
  {
    icon: BookOpen,
    title: "Course Management",
    desc: "Rich content with video streaming, PDFs, section ordering, lesson management, and bulk operations.",
    color: "text-chart-3 bg-chart-3/10 border-chart-3/20",
  },
  {
    icon: Award,
    title: "Certifications",
    desc: "Auto-generated certificates with unique IDs, QR verification portal, and branded templates.",
    color: "text-chart-4 bg-chart-4/10 border-chart-4/20",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    desc: "Real-time dashboards for performance, engagement, revenue, attendance, and predictive dropout risk.",
    color: "text-chart-5 bg-chart-5/10 border-chart-5/20",
  },
  {
    icon: Gamepad2,
    title: "Gamification Engine",
    desc: "Points, badges, leaderboards, streaks, and rewards to boost student engagement and completion rates.",
    color: "text-primary bg-primary/10 border-primary/20",
  },
]

const secondaryFeatures = [
  { icon: Users, title: "Multi-Tenant Architecture", desc: "Multiple institutes on shared infrastructure with complete data isolation." },
  { icon: Calendar, title: "Smart Scheduling", desc: "Timetables, event calendars, conflict detection, and recurring class support." },
  { icon: CreditCard, title: "Fees & Payments", desc: "Razorpay/Stripe integration with invoicing, reminders, refunds, and installments." },
  { icon: Shield, title: "Role-Based Access", desc: "6 user roles (Student, Instructor, Org Admin, Platform Admin, Parent, Support) with fine-grained permissions." },
  { icon: Globe, title: "Multi-Language", desc: "LibreTranslate integration supporting 10+ languages with auto-detection and content translation." },
  { icon: MessageCircle, title: "Real-time Chat", desc: "Socket.io powered messaging, course forums, and announcement broadcasting." },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Everything you need</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Build <span className="text-gradient-primary">smarter.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30"
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-24"
        >
          <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">And much more</h3>
          <h4 className="mt-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">
            Everything in <span className="text-gradient-primary">one place</span>
          </h4>
          <p className="mt-3 mb-10 max-w-xl text-sm leading-relaxed text-muted-foreground">
            From attendance to fees, timetables to chat. We handle the infrastructure so you can focus on teaching.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {secondaryFeatures.map((f) => (
            <motion.div key={f.title} variants={itemVariants} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="mb-1 text-sm font-bold text-foreground">{f.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
