"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

const footerLinks = {
  "Use cases": ["Course Management", "Live Classes", "Attendance", "Assessments", "Gradebook", "Fee Management", "Gamification", "AI Learning"],
  Industries: ["Higher Education", "K-12 Schools", "Coaching Centers", "Corporate Training", "EdTech Startups"],
  Company: ["About Us", "Careers", "Blog", "Contact", "Partners"],
  Support: ["Documentation", "API Reference", "Community", "Status", "Security"],
}

export function CTASection() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Ready to transform your institution?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join 500+ institutions already using Instatute to deliver world-class education.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-primary px-8 text-primary-foreground hover:bg-primary/90 glow-primary font-semibold">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="border-border bg-transparent px-8 text-foreground hover:bg-secondary">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Insta<span className="text-primary">tute</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The complete learning management platform for institutes, colleges, and schools.
              AI-powered, scalable, and built for the future of education.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-bold text-foreground">{category}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Instatute. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
