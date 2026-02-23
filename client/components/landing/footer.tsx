"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { GraduationCap, Twitter, Linkedin, Github, ArrowRight } from "lucide-react"

const footerLinks = {
  Platform: ["Course Management", "Live Classes", "Gamification", "AI Learning", "Certifications"],
  Courses: ["Browse All", "Web Development", "Data Science", "AI & ML", "Business"],
  Company: ["About Us", "Blog", "Careers", "Contact"],
  Support: ["Documentation", "API Reference", "Status", "Security"],
}

export function CTASection() {
  const router = useRouter()
  const [ctaLoading, setCtaLoading] = useState(false)
  return (
    <section
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: "#0A0F1E" }}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-96"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,153,0,0.1) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: "#FF9900" }}>
            Get Started Today
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
            Ready to transform{" "}
            <span className="lp-gradient-text">your institution?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            Join institutes already using Smart LMS to deliver world-class education.
            Free to start, scales with you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all"
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
                ; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(255,153,0,0.6)"
                  ; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
              }}
              onMouseLeave={(e) => {
                ; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(255,153,0,0.4)"
                  ; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
              }}
            >
              {ctaLoading ? "Loading..." : "Start Free Trial"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium text-white transition-all"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                ; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"
                  ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.4)"
              }}
              onMouseLeave={(e) => {
                ; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"
                  ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"
              }}
            >
              Talk to Sales
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer
      className="border-t py-16"
      style={{
        background: "#060B18",
        borderColor: "rgba(255,153,0,0.1)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand col */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #FF9900, #FFB347)" }}
              >
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Smart<span style={{ color: "#FF9900" }}>LMS</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              The complete AI-powered learning management platform for institutes, colleges, and schools.
            </p>
            {/* Social links */}
            <div className="mt-6 flex items-center gap-4">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Github, href: "#", label: "GitHub" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  onMouseEnter={(e) => {
                    ; (e.currentTarget as HTMLElement).style.background = "rgba(255,153,0,0.15)"
                      ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.4)"
                      ; (e.currentTarget as HTMLElement).style.color = "#FF9900"
                  }}
                  onMouseLeave={(e) => {
                    ; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"
                      ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"
                      ; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"
                  }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-bold text-white">{category}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm transition-colors"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "#FF9900")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)")
                      }
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            &copy; {new Date().getFullYear()} Smart LMS. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Security"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-sm transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)")
                }
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
