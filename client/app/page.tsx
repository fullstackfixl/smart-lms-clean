import { Navbar } from '../components/landing/navbar'
import { Hero } from '../components/landing/hero'
import { CourseShowcase } from '../components/landing/course-showcase'
import { Features } from '../components/landing/features'
import { CTASection, Footer } from '../components/landing/footer'

export const metadata = {
  title: "Smart LMS – AI-Powered Learning Platform for Institutes & Colleges",
  description:
    "Build scalable, AI-powered education platforms for institutes and coaching centers. Live classes, gamification, certifications, and smart analytics – all in one place.",
  openGraph: {
    title: "Smart LMS – The Future of Learning is Here",
    description:
      "AI-powered LMS for institutes, colleges, and schools. Start your free trial today.",
    type: "website",
  },
}

export default function Page() {
  return (
    <main style={{ background: "#0A0F1E", minHeight: "100vh" }}>
      <Navbar />
      <Hero />
      <CourseShowcase />
      <Features />
      <CTASection />
      <Footer />
    </main>
  )
}
