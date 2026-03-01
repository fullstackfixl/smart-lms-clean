"use client"

import { motion } from "framer-motion"
import { Button } from '../../components/ui/button'
import Link from "next/link"

const techStack = [
  "Next.js", "React", "React Native", "Node.js", "Express",
  "MongoDB", "Redis", "Socket.io", "Jitsi Meet", "Razorpay",
  "Stripe", "TensorFlow.js", "CloudFlare", "Docker",
  "Bull Queue", "LibreTranslate",
]

export function TechStack() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Works with
            <br />
            <span className="text-gradient-primary">your tech stack</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 flex flex-wrap gap-3"
        >
          {techStack.map((tech) => (
            <div
              key={tech}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <div className="h-5 w-5 rounded bg-secondary" />
              {tech}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="#features">
            <Button variant="outline" className="border-border bg-transparent text-foreground hover:bg-secondary">
              See all integrations
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
