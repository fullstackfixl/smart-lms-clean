"use client"

import { motion } from "framer-motion"
import {
  Brain, Video, BookOpen, Award, BarChart3, Gamepad2,
  Users, Calendar, CreditCard, Shield, Globe, MessageCircle,
} from "lucide-react"

const primaryFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    desc: "Auto-generated quizzes, smart recommendations, topic explanations, and predictive analytics for every student.",
  },
  {
    icon: Video,
    title: "Live Classes",
    desc: "Integrated Jitsi Meet video conferencing with auto-attendance, recording uploads, and scheduling.",
  },
  {
    icon: BookOpen,
    title: "Course Management",
    desc: "Rich content with video streaming, PDFs, section ordering, lesson management, and bulk operations.",
  },
  {
    icon: Award,
    title: "Certifications",
    desc: "Auto-generated certificates with unique IDs, QR verification portal, and branded templates.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    desc: "Real-time dashboards for performance, engagement, revenue, attendance, and predictive dropout risk.",
  },
  {
    icon: Gamepad2,
    title: "Gamification Engine",
    desc: "Points, badges, leaderboards, streaks, and rewards to boost student engagement and completion rates.",
  },
]

const deployFeatures = [
  { icon: Users, title: "Multi-Tenant Architecture", desc: "Multiple institutes on shared infrastructure with complete data isolation." },
  { icon: Calendar, title: "Smart Scheduling", desc: "Timetables, event calendars, conflict detection, and recurring class support." },
  { icon: CreditCard, title: "Fees & Payments", desc: "Razorpay/Stripe integration with invoicing, reminders, refunds, and installments." },
  { icon: Shield, title: "Role-Based Access", desc: "6 user roles with fine-grained permissions: Student, Instructor, Org Admin, Platform Admin, Parent, Support." },
  { icon: Globe, title: "Multi-Language", desc: "LibreTranslate integration supporting 10+ languages with auto-detection and content translation." },
  { icon: MessageCircle, title: "Real-time Chat", desc: "Socket.io powered messaging, course forums, and announcement broadcasting." },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function Features() {
  return (
    <>
      {/* BUILD SMARTER */}
      <section
        id="features"
        className="relative py-24 lg:py-32"
        style={{ background: "#0A0F1E" }}
      >
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,153,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,153,0,0.03) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FF9900" }}>
              Everything you need
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
              Build <span className="lp-gradient-text">Smarter.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              One platform to power every aspect of your institution's education delivery.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {primaryFeatures.map((f) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,153,0,0.12)",
                }}
                onMouseEnter={(e) => {
                  ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.4)"
                    ; (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"
                    ; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 50px -15px rgba(255,153,0,0.2)"
                }}
                onMouseLeave={(e) => {
                  ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.12)"
                    ; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                    ; (e.currentTarget as HTMLElement).style.boxShadow = "none"
                }}
              >
                {/* Orange glow accent */}
                <div
                  className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(255,153,0,0.12) 0%, transparent 70%)" }}
                />
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "rgba(255,153,0,0.12)" }}
                >
                  <f.icon className="h-6 w-6" style={{ color: "#FF9900" }} />
                </div>
                <h3 className="mb-2 text-base font-bold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DEPLOY ANYWHERE */}
      <section
        id="resources"
        className="relative py-24 lg:py-32"
        style={{ background: "#0D1426" }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FF9900" }}>
              Infrastructure
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
              Deploy <span className="lp-gradient-text">Anywhere.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              From attendance to fees, one platform to handle the infrastructure so you can focus on teaching.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {deployFeatures.map((f) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                className="flex gap-4 rounded-2xl p-5 transition-all duration-300"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,153,0,0.1)",
                }}
                onMouseEnter={(e) => {
                  ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.35)"
                    ; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"
                }}
                onMouseLeave={(e) => {
                  ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.1)"
                    ; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(255,153,0,0.1)" }}
                >
                  <f.icon className="h-5 w-5" style={{ color: "#FF9900" }} />
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-bold text-white">{f.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  )
}
