"use client"

import { motion } from "framer-motion"
import { Cloud, Server, Download, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const deployOptions = [
  {
    icon: Cloud,
    title: "Cloud Hosted",
    desc: "Deploy on our managed cloud. We handle scaling, backups, and 99.9% uptime for your institution.",
    cta: "Learn more",
    accent: "border-primary/20 hover:border-primary/40",
    iconStyle: "text-primary bg-primary/10",
  },
  {
    icon: Server,
    title: "On-prem / Hybrid",
    desc: "Run Instatute on your own infrastructure. Full control, enterprise support, and data sovereignty.",
    cta: "Learn more",
    accent: "border-accent/20 hover:border-accent/40",
    iconStyle: "text-accent bg-accent/10",
  },
  {
    icon: Download,
    title: "Open Source",
    desc: "Community edition. Download, self-host, and customize. Free forever for small institutions.",
    cta: "Download now",
    accent: "border-chart-3/20 hover:border-chart-3/40",
    iconStyle: "text-chart-3 bg-chart-3/10",
  },
]

export function DeploySection() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Deploy</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            <span className="text-gradient-primary">anywhere</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {deployOptions.map((opt, i) => (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group flex flex-col rounded-xl border ${opt.accent} bg-card p-6 transition-all`}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${opt.iconStyle}`}>
                <opt.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{opt.title}</h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">{opt.desc}</p>
              <Link href="/register">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border bg-transparent text-foreground hover:bg-secondary group"
                >
                  {opt.cta}
                  <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
