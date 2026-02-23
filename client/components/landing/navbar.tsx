"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown, GraduationCap } from "lucide-react"

const navLinks = [
  {
    label: "Platform",
    href: "#features",
    children: [
      { label: "Course Management", href: "#features", desc: "Create and manage courses at scale" },
      { label: "Live Classes", href: "#features", desc: "Real-time video conferencing with Jitsi" },
      { label: "AI-Powered Learning", href: "#features", desc: "Smart quizzes and recommendations" },
      { label: "Gamification", href: "#features", desc: "Points, badges & leaderboards" },
    ],
  },
  { label: "Courses", href: "#courses" },
  { label: "Resources", href: "#resources" },
  { label: "Pricing", href: "#pricing" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [ctaLoading, setCtaLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        background: scrolled
          ? "rgba(10,15,30,0.97)"
          : "rgba(10,15,30,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(255,153,0,0.15)" : "1px solid transparent",
        transition: "background 0.3s, border-color 0.3s",
      }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #FF9900, #FFB347)" }}
          >
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Smart<span style={{ color: "#FF9900" }}>LMS</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="relative"
              onMouseEnter={() => link.children && setActiveDropdown(link.label)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                href={link.href}
                className="flex items-center gap-1 rounded-md px-3.5 py-2 text-sm transition-colors"
                style={{ color: "rgba(255,255,255,0.7)" }}
                onMouseEnter={(e) => {
                  ; (e.currentTarget as HTMLElement).style.color = "#FF9900"
                }}
                onMouseLeave={(e) => {
                  ; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"
                }}
              >
                {link.label}
                {link.children && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>

              <AnimatePresence>
                {link.children && activeDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1 w-72 rounded-xl p-2 shadow-2xl"
                    style={{
                      background: "#0D1426",
                      border: "1px solid rgba(255,153,0,0.15)",
                    }}
                  >
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors"
                        style={{ color: "rgba(255,255,255,0.8)" }}
                        onMouseEnter={(e) => {
                          ; (e.currentTarget as HTMLElement).style.background = "rgba(255,153,0,0.1)"
                        }}
                        onMouseLeave={(e) => {
                          ; (e.currentTarget as HTMLElement).style.background = "transparent"
                        }}
                      >
                        <span className="text-sm font-medium text-white">{child.label}</span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {child.desc}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: "rgba(255,255,255,0.7)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#FF9900")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)")
            }
          >
            Log in
          </Link>
          <Link
            href="/apply"
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #FF9900, #e68a00)",
              boxShadow: "0 4px 20px rgba(255,153,0,0.35)",
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
            onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.boxShadow =
              "0 6px 30px rgba(255,153,0,0.55)")
            }
            onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.boxShadow =
              "0 4px 20px rgba(255,153,0,0.35)")
            }
          >
            {ctaLoading ? "Loading..." : "Get Started Free"}
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 lg:hidden"
          style={{ color: "rgba(255,255,255,0.7)" }}
          aria-label="Toggle mobile menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden lg:hidden"
            style={{ borderTop: "1px solid rgba(255,153,0,0.15)" }}
          >
            <div className="flex flex-col gap-1 px-4 py-4" style={{ background: "#0A0F1E" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm transition-colors"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                  onMouseEnter={(e) => {
                    ; (e.currentTarget as HTMLElement).style.color = "#FF9900"
                      ; (e.currentTarget as HTMLElement).style.background = "rgba(255,153,0,0.08)"
                  }}
                  onMouseLeave={(e) => {
                    ; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"
                      ; (e.currentTarget as HTMLElement).style.background = "transparent"
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,153,0,0.12)" }}>
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <button
                    className="w-full rounded-lg py-2.5 text-sm font-medium text-white"
                    style={{ border: "1px solid rgba(255,153,0,0.3)", background: "transparent" }}
                  >
                    Log in
                  </button>
                </Link>
                <Link href="/apply" onClick={(e) => {
                  e.preventDefault()
                  setMobileOpen(false)
                  if (ctaLoading) return
                  setCtaLoading(true)
                  setTimeout(() => {
                    setCtaLoading(false)
                    router.push("/apply")
                  }, 2000)
                }}>
                  <button
                    className="w-full rounded-lg py-2.5 text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #FF9900, #e68a00)" }}
                  >
                    {ctaLoading ? "Loading..." : "Get Started Free"}
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
