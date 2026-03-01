"use client"

import { motion } from "framer-motion"
import { Button } from '../../components/ui/button'
import Link from "next/link"

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    handle: "@sarahchen_edu",
    text: "Instatute transformed our institution. The AI quiz generation alone saved our instructors 20+ hours per week. The multi-tenant architecture is exactly what we needed.",
    role: "Dean of Online Education",
  },
  {
    name: "Rajesh Kumar",
    handle: "@rajesh_academy",
    text: "We migrated from Moodle to Instatute and haven't looked back. The live class integration with automatic attendance tracking is phenomenal.",
    role: "Founder, TechAcademy",
  },
  {
    name: "Emily Rodriguez",
    handle: "@emilyrod_teach",
    text: "The course creation workflow is incredibly intuitive. Drag-and-drop lesson ordering, bulk operations, and the analytics dashboard give me everything I need.",
    role: "Senior Instructor",
  },
  {
    name: "Michael Park",
    handle: "@mikep_dev",
    text: "Just integrated Instatute with our existing React Native app. The API is clean, well-documented, and the SDK makes everything seamless.",
    role: "Full-Stack Developer",
  },
  {
    name: "Ananya Sharma",
    handle: "@ananya_learns",
    text: "The gamification system keeps students engaged like nothing else. Points, badges, leaderboards, and streak tracking. Our completion rates went up 40%.",
    role: "Product Manager",
  },
  {
    name: "James Wilson",
    handle: "@jameswilson_cto",
    text: "The parent portal is a game changer. Parents can monitor grades, attendance, fees, and progress all in one place. Reduced our support tickets by 60%.",
    role: "CTO, EduGroup",
  },
]

export function Community() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Trusted by educators worldwide
          </h2>
          <p className="mt-3 text-muted-foreground">By institutes, for institutes</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="https://github.com">
              <Button variant="outline" size="sm" className="border-border bg-transparent text-foreground hover:bg-secondary">
                GitHub
              </Button>
            </Link>
            <Link href="https://discord.com">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Join Community
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="mb-4 break-inside-avoid rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.handle}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.text}</p>
              <p className="mt-2 text-xs text-primary">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
