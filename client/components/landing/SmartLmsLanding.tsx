'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

function useScrolled() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return scrolled
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.18 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])
}

const services = [
  {
    title: 'Academic Operations',
    description:
      'Run departments, programs, batches, subjects, timetables, and college approvals from one operating layer.',
  },
  {
    title: 'Course Publishing',
    description:
      'Let instructors build drafts, submit for review, publish cleanly, and keep curriculum quality under control.',
  },
  {
    title: 'Live Learning',
    description:
      'Deliver live classes, recorded sessions, attendance, quizzes, assignments, and timely student notifications.',
  },
  {
    title: 'Student Experience',
    description:
      'Give learners a clear dashboard for classes, progress, results, certificates, and course communication.',
  },
  {
    title: 'Commerce and Certificates',
    description:
      'Support paid courses, enrollments, outcomes, and completion credentials without fragmented tooling.',
  },
  {
    title: 'Reporting and Control',
    description:
      'Track engagement, completion, teaching activity, and admin visibility with practical data across the flow.',
  },
]

const pillars = [
  'Built for colleges, institutes, academies, and coaching brands',
  'Supports admin, instructor, and student journeys in one product',
  'Matches real course approval, delivery, and assessment workflows',
]

const workflow = [
  {
    step: '01',
    title: 'Structure the institution',
    description: 'Create departments, programs, batches, subjects, and the rules that define your academic model.',
  },
  {
    step: '02',
    title: 'Publish with review',
    description: 'Instructors create course drafts, org admins review quality, and approved courses go live in the right places.',
  },
  {
    step: '03',
    title: 'Run learning daily',
    description: 'Schedule live classes, push attendance, release quizzes, and keep students informed from one dashboard.',
  },
  {
    step: '04',
    title: 'Measure outcomes',
    description: 'See engagement and completion signals early, then improve delivery instead of guessing what is broken.',
  },
]

const audiences = [
  {
    title: 'For leadership',
    body: 'A sharper institutional storefront, stronger governance, and one system for academic operations and delivery.',
  },
  {
    title: 'For instructors',
    body: 'Faster course creation, cleaner content management, easier live teaching, and fewer admin bottlenecks.',
  },
  {
    title: 'For students',
    body: 'A calmer learning experience with clear schedules, attendance, quizzes, progress, and support.',
  },
]

const metrics = [
  { value: '1 platform', label: 'for admin, faculty, and students' },
  { value: '6 core layers', label: 'covering operations to delivery' },
  { value: '100%', label: 'aligned to your actual LMS workflows' },
]

export function SmartLmsLanding() {
  const scrolled = useScrolled()
  useReveal()

  return (
    <div className="min-h-screen bg-[#f4efe7] text-[#0f172a]">
      <style jsx global>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        [data-reveal].is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          [data-reveal] {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-[#d8d1c6] bg-[#f4efe7]/90 backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-bold text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]">
              SL
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#64748b]">Smart LMS</p>
              <p className="text-sm font-semibold text-[#0f172a]">Education Operating System</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#334155] lg:flex">
            <a href="#services" className="transition hover:text-[#0f172a]">Services</a>
            <a href="#workflow" className="transition hover:text-[#0f172a]">Workflow</a>
            <a href="#experience" className="transition hover:text-[#0f172a]">Experience</a>
            <a href="#contact" className="transition hover:text-[#0f172a]">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-[#c9c1b4] px-5 py-2.5 text-sm font-semibold text-[#0f172a] transition hover:border-[#0f172a] lg:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/apply"
              className="inline-flex rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
            >
              Create your own platform
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_28%)]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:pb-28 lg:pt-20">
            <div className="relative z-10" data-reveal>
              <div className="inline-flex rounded-full border border-[#d8d1c6] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#475569] backdrop-blur">
                Built around real college and institute workflows
              </div>
              <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-[0.96] tracking-[-0.05em] text-[#0f172a] md:text-6xl lg:text-7xl">
                The landing page your LMS product deserved from day one.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-[#475569] md:text-xl">
                Smart LMS helps colleges, academies, and education brands manage operations, publish courses,
                run live learning, and deliver a student experience that feels polished instead of patched together.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-full bg-[#0f172a] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
                >
                  Create your own platform
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center rounded-full border border-[#c9c1b4] bg-white/70 px-7 py-4 text-sm font-semibold text-[#0f172a] transition hover:border-[#0f172a]"
                >
                  Explore what it covers
                </a>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[28px] border border-[#ddd5c9] bg-white/70 p-5 backdrop-blur">
                    <p className="text-3xl font-bold tracking-[-0.05em] text-[#0f172a]">{metric.value}</p>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10" data-reveal>
              <div className="rounded-[32px] border border-[#122033] bg-[#0f172a] p-5 text-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
                <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#16233a_0%,#0f172a_100%)] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-[#94a3b8]">Live Product View</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">College workflow in motion</h2>
                    </div>
                    <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Active
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Course draft submitted</p>
                          <p className="mt-1 text-sm text-[#94a3b8]">BCA Data Structures - pending org-admin review</p>
                        </div>
                        <div className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-[#172033]">
                          Review
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.26em] text-[#94a3b8]">Academic setup</p>
                        <p className="mt-3 text-2xl font-semibold">12 batches</p>
                        <p className="mt-2 text-sm text-[#94a3b8]">Departments, subjects, and timetables mapped cleanly.</p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <p className="text-xs uppercase tracking-[0.26em] text-[#94a3b8]">Learning delivery</p>
                        <p className="mt-3 text-2xl font-semibold">28 live sessions</p>
                        <p className="mt-2 text-sm text-[#94a3b8]">Attendance, quizzes, and notifications kept in sync.</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-[#f8fafc] p-5 text-[#0f172a]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">Student side now feels simple</p>
                          <p className="mt-1 text-sm text-[#475569]">Classes, progress, quiz access, and updates in one calm flow.</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-[#dbeafe]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {pillars.map((pillar) => (
                    <div key={pillar} className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[#cbd5e1]">
                      {pillar}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#ddd5c9] bg-white/60">
          <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 text-sm font-semibold uppercase tracking-[0.24em] text-[#64748b] sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
            <span>Academic administration</span>
            <span>Instructor publishing</span>
            <span>Student engagement</span>
            <span>Commerce and certification</span>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-3xl" data-reveal>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b45309]">Services</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#0f172a] md:text-5xl">
              Everything on the homepage now reflects what the platform actually does.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#475569]">
              This is positioned as a full education operating system, not a vague template site. Every section now
              speaks to the same college, instructor, and student flows we validated in the product.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <article
                key={service.title}
                data-reveal
                className="group rounded-[30px] border border-[#ddd5c9] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.1)]"
                style={{ transitionDelay: `${index * 60}ms` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f172a] text-sm font-bold text-white">
                  0{index + 1}
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#0f172a]">{service.title}</h3>
                <p className="mt-4 text-base leading-7 text-[#475569]">{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="bg-[#0f172a] text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-28">
            <div data-reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#fbbf24]">Experience</p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] md:text-5xl">
                Designed for the people who use the platform every day.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#94a3b8]">
                The new landing page promises a system that respects each role. Leadership sees governance, faculty
                sees speed, and students see clarity.
              </p>
            </div>

            <div className="grid gap-5">
              {audiences.map((audience, index) => (
                <article
                  key={audience.title}
                  data-reveal
                  className="rounded-[28px] border border-white/10 bg-white/5 p-7"
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <h3 className="text-2xl font-semibold tracking-[-0.04em]">{audience.title}</h3>
                  <p className="mt-3 text-base leading-7 text-[#cbd5e1]">{audience.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl" data-reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b45309]">Workflow</p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#0f172a] md:text-5xl">
                A homepage story that follows the real product journey.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[#475569]" data-reveal>
              From academic setup to published courses, from live classes to student outcomes, the page now sells the
              system through believable steps instead of generic claims.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-4">
            {workflow.map((item, index) => (
              <article
                key={item.step}
                data-reveal
                className="rounded-[30px] border border-[#ddd5c9] bg-[#fffdf8] p-7"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b45309]">{item.step}</p>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#0f172a]">{item.title}</h3>
                <p className="mt-4 text-base leading-7 text-[#475569]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10 lg:pb-28">
          <div className="grid gap-6 rounded-[36px] border border-[#ddd5c9] bg-[linear-gradient(135deg,#ffffff_0%,#f7f1e7_54%,#e0f2fe_100%)] p-8 shadow-[0_25px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div data-reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b45309]">Why it lands better</p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#0f172a] md:text-5xl">
                Cleaner trust. Better positioning. Stronger product perception.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#475569]">
                The visual system is more premium, the message is more specific, and the structure gives buyers a much
                faster understanding of why Smart LMS matters.
              </p>
            </div>

            <div className="grid gap-4" data-reveal>
              <div className="rounded-[28px] border border-[#d7d0c3] bg-white/80 p-6">
                <p className="text-sm font-semibold text-[#0f172a]">According to your product content</p>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  Messaging now aligns with courses, approvals, batches, live classes, quizzes, analytics, and student delivery.
                </p>
              </div>
              <div className="rounded-[28px] border border-[#d7d0c3] bg-white/80 p-6">
                <p className="text-sm font-semibold text-[#0f172a]">According to your service buyers</p>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  The page speaks to colleges, institutes, coaching centers, and training brands instead of everyone and no one.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-[#111827] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-24">
            <div data-reveal>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#fbbf24]">Next step</p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] md:text-5xl">
                If the product is serious, the first impression should be serious too.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#cbd5e1]">
                This landing page is now built to convert interest into confidence, with a design language that feels
                polished and messaging that matches the system users will actually buy.
              </p>
            </div>

            <div data-reveal className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.28em] text-[#94a3b8]">Start now</p>
              <div className="mt-8 grid gap-4">
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#0f172a] transition hover:bg-[#e2e8f0]"
                >
                  Create your own platform
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-4 text-sm font-semibold text-white transition hover:border-white/50"
                >
                  Sign in to continue
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1f2937] bg-[#111827]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-[#94a3b8] lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>Smart LMS for colleges, institutes, and modern education businesses.</p>
          <p>Academic operations, course publishing, live learning, and student delivery in one platform.</p>
        </div>
      </footer>
    </div>
  )
}
