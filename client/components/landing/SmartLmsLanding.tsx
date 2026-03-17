'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'

function useOnScrollThreshold(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

function TemplateThumb({ accent }: { accent: string }) {
  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-2xl"
      style={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.10)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/40 z-10" />
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="flex items-center gap-3 rounded-full px-5 py-2.5" style={{ background: `${accent}22`, border: `1px solid ${accent}55` }}>
          <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ background: accent }} />
          <span className="text-xs font-semibold text-white">Live Preview</span>
        </div>
      </div>
    </div>
  )
}

function TemplateImage({ src, accent }: { src: string; accent: string }) {
  return (
    <div
      className="relative aspect-[16/10] overflow-hidden rounded-2xl"
      style={{ background: '#1a1f35', border: '1px solid rgba(255,255,255,0.10)' }}
    >
      <img
        src={src}
        alt="Template preview"
        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent}`, boxShadow: `0 4px 20px ${accent}55` }}>
              <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <div className="h-2 w-16 rounded" style={{ background: 'rgba(255,255,255,0.6)' }} />
              <div className="mt-1 h-1.5 w-12 rounded" style={{ background: 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
          <div className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `${accent}33`, color: accent, border: `1px solid ${accent}55` }}>
            PRO
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplatesSection() {
  const templates = useMemo(
    () => [
      {
        name: 'Modern CBSE School',
        category: 'School',
        desc: 'Clean, parent-friendly portal with announcements, homework and attendance. Perfect for K-12.',
        accent: '#22C55E',
        tags: ['Mobile-first', 'Parents', 'Homework'],
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&auto=format&fit=crop',
      },
      {
        name: 'Engineering College Pro',
        category: 'College',
        desc: 'Departments, semester-wise courses, labs, internal assessments, and placement-ready analytics.',
        accent: '#60A5FA',
        tags: ['Departments', 'Semesters', 'Analytics'],
        image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80&auto=format&fit=crop',
      },
      {
        name: 'Coaching Academy Boost',
        category: 'Coaching',
        desc: 'Built for high frequency tests, live batches, doubt solving, and leaderboards for engagement.',
        accent: '#F59E0B',
        tags: ['Batches', 'Tests', 'Leaderboards'],
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80&auto=format&fit=crop',
      },
      {
        name: 'International School Premium',
        category: 'School',
        desc: 'Polished, premium look with multi-campus support, events calendar, and role-based dashboards.',
        accent: '#A78BFA',
        tags: ['Multi-campus', 'Events', 'Branding'],
        image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80&auto=format&fit=crop',
      },
      {
        name: 'Arts & Commerce College',
        category: 'College',
        desc: 'Timetable, faculty rooms, assignments, and certificate-ready coursework designed for flexibility.',
        accent: '#F472B6',
        tags: ['Timetable', 'Assignments', 'Certificates'],
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80&auto=format&fit=crop',
      },
      {
        name: 'Skill Institute Minimal',
        category: 'Institute',
        desc: 'A minimal template for fast launches — courses, payments, certificates, and learner support.',
        accent: '#34D399',
        tags: ['Fast launch', 'Payments', 'Support'],
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80&auto=format&fit=crop',
      },
    ],
    []
  )

  const categories = useMemo(() => ['All', 'School', 'College', 'Coaching', 'Institute'], [])
  const [active, setActive] = useState('All')

  const filtered = useMemo(() => {
    if (active === 'All') return templates
    return templates.filter((t) => t.category === active)
  }, [active, templates])

  return (
    <section id="templates" style={{ background: '#0A0F2C' }}>
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <PillBadge label="🏫 SCHOOL TEMPLATES" />
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Pick a Template. Launch in Days. Make it Yours.
          </h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Start from a proven portal layout and fully brand it — colors, sections, content, and navigation.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((c) => {
            const isActive = c === active
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActive(c)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-200 hover:scale-[1.02]"
                style={{
                  background: isActive ? 'rgba(34,197,94,0.16)' : 'rgba(255,255,255,0.04)',
                  border: isActive ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.10)',
                  color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)',
                }}
              >
                {c}
              </button>
            )
          })}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, idx) => (
            <div key={t.name} className="slms-reveal" data-reveal style={{ transitionDelay: `${idx * 60}ms` }}>
              <div className="rounded-2xl p-6" style={{ background: '#0D1535', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {t.category}
                    </div>
                    <div className="mt-2 font-display text-lg font-extrabold text-white">{t.name}</div>
                  </div>
                  <div className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: `${t.accent}22`, border: `1px solid ${t.accent}55`, color: 'rgba(255,255,255,0.85)' }}>
                    Ready
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {t.desc}
                </p>

                <div className="mt-5 group">
                  <TemplateImage src={t.image} accent={t.accent} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-transform duration-200 hover:scale-[1.01]"
                    style={{ background: `${t.accent}`, color: '#03120A', boxShadow: '0 14px 44px -18px rgba(0,0,0,0.25)' }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.filter = 'brightness(0.95)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.filter = 'brightness(1)'
                    }}
                  >
                    Use Template
                  </Link>
                  <Link
                    href="#contact"
                    className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.01]"
                    style={{ borderColor: 'rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)' }}
                  >
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function useRevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!els.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add('is-visible')
            obs.unobserve(e.target)
          }
        }
      },
      { threshold: 0.18 }
    )

    for (const el of els) obs.observe(el)
    return () => obs.disconnect()
  }, [])
}

function useCountUpOnView(target: number, options?: { durationMs?: number }) {
  const durationMs = options?.durationMs ?? 900
  const ref = useRef<HTMLDivElement | null>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let raf = 0
    let started = false

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started) {
            started = true
            const start = performance.now()
            const from = 0
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / durationMs)
              const next = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)))
              setValue(next)
              if (t < 1) raf = requestAnimationFrame(tick)
            }
            raf = requestAnimationFrame(tick)
            obs.disconnect()
          }
        }
      },
      { threshold: 0.55 }
    )

    obs.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      obs.disconnect()
    }
  }, [durationMs, target])

  return { ref, value }
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-8 w-8 rounded-full"
        style={{ background: '#22C55E', boxShadow: '0 0 0 6px rgba(34,197,94,0.12)' }}
      />
      <span className="text-lg font-semibold tracking-tight text-white">Smart LMS</span>
    </div>
  )
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-[#03120A] transition-transform duration-200 hover:scale-[1.02]"
      style={{ background: '#22C55E', boxShadow: '0 14px 44px -18px rgba(34,197,94,0.8)' }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = '#16A34A'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 18px 52px -18px rgba(34,197,94,0.9)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = '#22C55E'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 14px 44px -18px rgba(34,197,94,0.8)'
      }}
    >
      {children}
    </Link>
  )
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
      style={{ borderColor: 'rgba(255,255,255,0.22)', background: 'transparent' }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {children}
    </Link>
  )
}

function LandingNavbar() {
  const scrolled = useOnScrollThreshold(18)
  const [open, setOpen] = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50"
      style={{
        background: scrolled ? 'rgba(6,11,31,0.78)' : 'rgba(6,11,31,0.18)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
        transition: 'background 220ms ease, border-color 220ms ease, backdrop-filter 220ms ease',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          <Link href="#features" className="text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Features
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-2 text-sm"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              Solutions
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>▾</span>
            </button>
            {solutionsOpen && (
              <div
                className="absolute left-0 top-full mt-3 w-[280px] rounded-2xl p-2"
                style={{
                  background: '#0D1535',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 24px 70px -40px rgba(0,0,0,0.85)',
                }}
              >
                {[
                  { t: 'Partner Training', d: 'Enable your channel with consistent learning' },
                  { t: 'Customer Education', d: 'Onboard users and reduce support load' },
                  { t: 'Internal L&D', d: 'Build skills across teams and roles' },
                ].map((x) => (
                  <Link
                    key={x.t}
                    href="#contact"
                    className="block rounded-xl px-4 py-3 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.9)' }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    <div className="text-sm font-semibold text-white">{x.t}</div>
                    <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {x.d}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="#contact" className="text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
            Contact Us
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden"
          style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="text-white">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div
          className="border-t lg:hidden"
          style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(6,11,31,0.92)', backdropFilter: 'blur(16px)' }}
        >
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col gap-3">
              <Link href="#features" className="rounded-xl px-4 py-3 text-sm text-white" onClick={() => setOpen(false)}>
                Features
              </Link>
              <Link href="#integrations" className="rounded-xl px-4 py-3 text-sm text-white" onClick={() => setOpen(false)}>
                Solutions
              </Link>
              <Link href="#contact" className="rounded-xl px-4 py-3 text-sm text-white" onClick={() => setOpen(false)}>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function CompanyLogo({ name }: { name: string }) {
  return (
    <div
      className="flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold tracking-wide"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.78)' }}
    >
      {name}
    </div>
  )
}

function HeroSection() {
  const logos = useMemo(
    () => ['NorthPeak', 'Flextor', 'Aster & Co', 'CloudNine', 'Venturely', 'IronWorks', 'BlueFrame'],
    []
  )

  return (
    <section className="relative overflow-hidden" style={{ background: '#0A0F2C' }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 400px at 50% 18%, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0) 60%), radial-gradient(700px 300px at 70% 10%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-32 lg:px-8 lg:pb-20 lg:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="slms-fade-up font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Launch a Modern School LMS That Students Love
          </h1>
          <p
            className="mt-6 slms-fade-up text-base leading-relaxed sm:text-lg"
            style={{ color: 'rgba(255,255,255,0.6)', animationDelay: '120ms' }}
          >
            Beautiful portals, live classes, attendance, tests, certificates, and analytics — all in one platform you can brand as your own.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="slms-fade-up" style={{ animationDelay: '220ms' }}>
              <PrimaryButton href="#contact">Get a Demo</PrimaryButton>
            </div>
            <div className="slms-fade-up" style={{ animationDelay: '300ms' }}>
              <SecondaryButton href="#templates">See Templates</SecondaryButton>
            </div>
          </div>

          <p className="mt-8 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Trusted by schools, colleges, and coaching institutes.
          </p>
        </div>

        <div className="mt-10 slms-marquee" aria-label="Company logos">
          <div className="slms-marquee-track gap-4 pr-4">
            {[...logos, ...logos].map((name, idx) => (
              <CompanyLogo key={`${name}-${idx}`} name={name} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsBar() {
  const up = useCountUpOnView(999, { durationMs: 900 })
  const csat = useCountUpOnView(91, { durationMs: 850 })
  const eng = useCountUpOnView(77, { durationMs: 850 })

  return (
    <section style={{ background: '#050505' }}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 text-center sm:grid-cols-3 lg:px-8">
        <div ref={up.ref}>
          <div className="font-display text-4xl font-extrabold text-white sm:text-5xl">{(up.value / 10).toFixed(1)}%</div>
          <div className="mt-2 text-xs font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Platform Uptime
          </div>
        </div>
        <div ref={csat.ref}>
          <div className="font-display text-4xl font-extrabold text-white sm:text-5xl">{csat.value}%</div>
          <div className="mt-2 text-xs font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
            CSAT Score
          </div>
        </div>
        <div ref={eng.ref}>
          <div className="font-display text-4xl font-extrabold text-white sm:text-5xl">{eng.value}%</div>
          <div className="mt-2 text-xs font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Increase in Engagement
          </div>
        </div>
      </div>
    </section>
  )
}

function PillBadge({ label }: { label: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.10)',
        color: 'rgba(255,255,255,0.85)',
      }}
    >
      {label}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-7"
      style={{ background: '#0D1535', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {children}
    </div>
  )
}

function FormatChips() {
  const chips = ['PDF', 'Video', 'Audio', 'SCORM', 'Slides', 'Article']
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={c}
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

function MiniBrowserMock() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.24)' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
        <div className="ml-auto rounded-full px-3 py-1 text-[11px]" style={{ background: 'rgba(34,197,94,0.14)', color: 'rgba(255,255,255,0.8)' }}>
          Portal Builder
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(13,21,53,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="mt-3 h-2 rounded" style={{ background: 'rgba(255,255,255,0.10)' }} />
            <div className="mt-2 h-2 w-2/3 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function VideoCallMock() {
  return (
    <div className="mt-6 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative aspect-video overflow-hidden rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="absolute left-3 top-3 rounded-full px-2 py-1 text-[11px]" style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)' }}>
              Live
            </div>
            <div className="absolute bottom-3 left-3 h-2 w-20 rounded" style={{ background: 'rgba(255,255,255,0.10)' }} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          {['🎤', '🎥', '🖥️'].map((x) => (
            <div key={x} className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {x}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: 'rgba(34,197,94,0.14)', color: 'rgba(255,255,255,0.8)' }}>
          Attendance ✓
        </div>
      </div>
    </div>
  )
}

function CertificateMock() {
  return (
    <div className="mt-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Certificate of Completion
          </div>
          <div className="mt-1 text-sm font-semibold text-white">Smart LMS Academy</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(34,197,94,0.14)' }}>
          <span className="text-lg">✓</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { k: 'Learner', v: 'Alex Morgan' },
          { k: 'Score', v: '92%' },
          { k: 'Issued', v: 'Instantly' },
          { k: 'Valid', v: 'Verified' },
        ].map((x) => (
          <div key={x.k} className="rounded-xl p-3" style={{ background: 'rgba(13,21,53,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {x.k}
            </div>
            <div className="mt-1 text-sm font-semibold text-white">{x.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <section id="features" style={{ background: '#0A0F2C' }}>
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <PillBadge label="⚙ FEATURES" />
          <h2
            className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Train Confidently, Launch Faster, Scale Smarter
          </h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Core features that simplify delivery, boost engagement, and keep your training on-brand and on track
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="slms-reveal" data-reveal>
            <Card>
              <h3 className="font-display text-lg font-bold text-white">Diverse Content & Format Support</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Upload SCORM, TinCan, videos, PDFs — or deliver learning in the format that best fits your content and
                audience.
              </p>
              <FormatChips />
            </Card>
          </div>

          <div className="slms-reveal" data-reveal style={{ transitionDelay: '80ms' }}>
            <Card>
              <h3 className="font-display text-lg font-bold text-white">Branded Experiences, Your Way</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Design your own portal just how you want. Customise every touchpoint to reflect your brand — no code
                required.
              </p>
              <MiniBrowserMock />
            </Card>
          </div>

          <div className="slms-reveal" data-reveal style={{ transitionDelay: '140ms' }}>
            <Card>
              <h3 className="font-display text-lg font-bold text-white">Host Live Sessions Without External Tools</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Host live sessions and cohorts directly inside your academy with built-in scheduling, reminders, and
                attendance tracking.
              </p>
              <VideoCallMock />
            </Card>
          </div>

          <div className="slms-reveal" data-reveal style={{ transitionDelay: '220ms' }}>
            <Card>
              <h3 className="font-display text-lg font-bold text-white">Certifications & Skill Validation</h3>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Automate completion-based certificates to ensure regulatory compliance and track progress with ease.
              </p>
              <CertificateMock />
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

function AccordionItem({
  title,
  desc,
  open,
  onToggle,
}: {
  title: string
  desc: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="rounded-2xl"
      style={{ background: open ? 'rgba(255,255,255,0.04)' : 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="text-white" style={{ opacity: 0.7 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      <div
        className="grid overflow-hidden px-5"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 260ms ease',
        }}
      >
        <div className="min-h-0 pb-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {desc}
        </div>
      </div>
    </div>
  )
}

function PhoneMock() {
  return (
    <div
      className="mx-auto w-full max-w-sm rounded-[36px] p-4"
      style={{ background: '#0D1535', border: '1px solid rgba(255,255,255,0.10)' }}
    >
      <div
        className="rounded-[28px] p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Smart LMS
          </div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            11:08
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl p-3" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Announcement
            </div>
            <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
              New partner onboarding path is live. Start now.
            </div>
          </div>

          {[
            { t: 'Reminder', d: 'Live cohort session starts in 30 minutes' },
            { t: 'Message', d: 'HR: Please complete compliance training' },
            { t: 'Progress', d: 'You earned a new badge: Consistent Learner' },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-white">{x.t}</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  now
                </div>
              </div>
              <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {x.d}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Type a message...
          </span>
          <span className="text-sm" style={{ color: 'rgba(34,197,94,0.9)' }}>
            ➤
          </span>
        </div>
      </div>
    </div>
  )
}

function EngagementSection() {
  const items = useMemo(
    () => [
      {
        t: 'Communicate Smarter with In-App Messaging',
        d: 'Announce updates, send nudges, and trigger reminders through built-in newsfeeds, alerts, and email.',
      },
      { t: 'Train Anywhere with Mobile-First Access', d: 'A fast, responsive learning experience across devices.' },
      { t: 'Build a Learning Culture with Communities', d: 'Enable discussions, peer learning, and support at scale.' },
      { t: 'Validate Knowledge with Built-in Assessments', d: 'Quizzes and evaluations that measure real learning.' },
      { t: 'Prove Training ROI with Actionable Analytics', d: 'Dashboards that show adoption, completion, and impact.' },
      { t: 'Deliver the Right Content with Learning Paths', d: 'Sequence learning to guide learners from basics to mastery.' },
    ],
    []
  )

  const [active, setActive] = useState(items[0]?.t ?? '')

  return (
    <section style={{ background: '#060B1F' }}>
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Keep Training Relevant, Engaging & Always On
          </h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Support long-term learning with tools that personalise journeys, boost accountability, and build a connected
            learning culture
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-3">
            {items.map((x) => (
              <AccordionItem
                key={x.t}
                title={x.t}
                desc={x.d}
                open={active === x.t}
                onToggle={() => setActive((p) => (p === x.t ? '' : x.t))}
              />
            ))}
          </div>

          <div className="slms-reveal" data-reveal>
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  )
}

function TwoColCard({
  title,
  desc,
  right,
}: {
  title: string
  desc: string
  right: React.ReactNode
}) {
  return (
    <div
      className="grid gap-8 rounded-2xl p-7 lg:grid-cols-2 lg:items-center"
      style={{ background: '#0D1535', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div>
        <h3 className="font-display text-xl font-extrabold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {desc}
        </p>
      </div>
      <div>{right}</div>
    </div>
  )
}

function MigrationMock() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="rounded-2xl px-4 py-3 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.85)' }}>
        Current LMS
      </div>
      <div className="text-xl" style={{ color: 'rgba(34,197,94,0.9)' }}>
        →
      </div>
      <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold" style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)', color: 'rgba(255,255,255,0.88)' }}>
        <span>⚡</span>
        Smart LMS
      </div>
      <div className="ml-2 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}>
        Support included
      </div>
    </div>
  )
}

function LeaderboardMock() {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Leaderboard</div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          This week
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {[
          { n: 'Ayesha', xp: 1240, s: '🔥 7 day streak' },
          { n: 'Rohan', xp: 980, s: '⭐ Level up' },
          { n: 'Meera', xp: 860, s: '🏅 Badge earned' },
        ].map((x, i) => (
          <div key={x.n} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(13,21,53,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div className="text-sm font-semibold text-white">
                {i + 1}. {x.n}
              </div>
              <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {x.s}
              </div>
            </div>
            <div className="text-sm font-extrabold" style={{ color: '#22C55E' }}>
              {x.xp} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OnboardingGamificationSection() {
  return (
    <section style={{ background: '#0A0F2C' }}>
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="grid gap-6">
          <div className="slms-reveal" data-reveal>
            <TwoColCard
              title="Go Live Quick with Onboarding Support"
              desc="Our team assists with platform setup, data migration, and tailored onboarding so you can go live faster and happier."
              right={<MigrationMock />}
            />
          </div>
          <div className="slms-reveal" data-reveal style={{ transitionDelay: '120ms' }}>
            <TwoColCard
              title="Gamify Learning to Drive Participation"
              desc="Boost engagement through badges, challenges, and achievement tracking that make learning rewarding and addictive."
              right={<LeaderboardMock />}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function IntegrationsSection() {
  const integrations = [
    'Dropbox',
    '2Checkout',
    'Google Drive',
    'Calendar',
    'OneDrive',
    'Google',
    'Zapier',
    'GitHub',
    'Pabbly',
    'Google Analytics',
    'Stripe',
    'PayPal',
    'WhatsApp',
    'YouTube',
    'Razorpay',
  ]

  return (
    <section id="integrations" style={{ background: '#060B1F' }}>
      <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Connect Smart LMS to the Tools You Trust
          </h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            From HRMS to CRM, video to analytics — plug into 50+ integrations and automate your training workflows across
            your tech stack.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {integrations.map((name) => (
            <div
              key={name}
              className="flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact" style={{ background: '#0A0F2C' }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-start lg:px-8">
        <div>
          <h2
            className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Ready to Build Your Corporate LMS? Let's Chat
          </h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Tell us what you're trying to achieve — we'll recommend the right approach, rollout plan, and feature set.
          </p>
        </div>

        <form
          className="rounded-2xl p-7"
          style={{ background: '#0D1535', border: '1px solid rgba(255,255,255,0.07)' }}
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                First Name
              </label>
              <input
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Last Name
              </label>
              <input
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Business Email
              </label>
              <input
                type="email"
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
                placeholder="Business Email"
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Phone Number
              </label>
              <div className="mt-2 flex overflow-hidden rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
                <div className="flex items-center px-3 text-sm" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>
                  +91
                </div>
                <input
                  className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Goals
            </label>
            <textarea
              className="mt-2 min-h-[120px] w-full resize-none rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
              placeholder="Goals"
            />
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-transform duration-200 hover:scale-[1.01]"
            style={{ background: '#22C55E', color: '#03120A', boxShadow: '0 14px 44px -18px rgba(34,197,94,0.8)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = '#16A34A'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 18px 52px -18px rgba(34,197,94,0.9)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = '#22C55E'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 14px 44px -18px rgba(34,197,94,0.8)'
            }}
          >
            Talk to Us
          </button>
        </form>
      </div>
    </section>
  )
}

function FooterSection() {
  const social = [
    { t: 'in', label: 'LinkedIn' },
    { t: 'wa', label: 'WhatsApp' },
    { t: 'yt', label: 'YouTube' },
    { t: '𝕏', label: 'Twitter' },
    { t: 'ig', label: 'Instagram' },
    { t: 'f', label: 'Facebook' },
  ]

  return (
    <footer style={{ background: '#060B1F', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <LogoMark />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Corporate learning that scales across every audience.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Reach Out</div>
            <div className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              hello@smartlms.com
            </div>
            <div className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Call Us — +91 XXXXX XXXXX
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {social.map((s) => (
                <div
                  key={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  title={s.label}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.8)' }}
                >
                  <span className="text-sm font-semibold">{s.t}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-white">Location</div>
            <div className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Smart LMS HQ
              <br />
              Corporate Learning Lane
              <br />
              Bengaluru, India
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Copyright © 2025 Smart LMS. All Rights Reserved.
          </div>
          <div className="flex flex-wrap gap-2">
            {['Capterra 4.3★', 'AWS Partner', 'Widevine', 'PlayReady'].map((x) => (
              <div
                key={x}
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}
              >
                {x}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export function SmartLmsLanding() {
  useRevealOnScroll()

  return (
    <main style={{ background: '#0A0F2C' }}>
      <LandingNavbar />
      <HeroSection />
      <StatsBar />
      <TemplatesSection />
      <FeaturesSection />
      <EngagementSection />
      <OnboardingGamificationSection />
      <IntegrationsSection />
      <ContactSection />
      <FooterSection />
    </main>
  )
}
