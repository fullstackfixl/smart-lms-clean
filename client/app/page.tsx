import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { CourseShowcase } from "@/components/landing/course-showcase"
import { Features } from "@/components/landing/features"
import { DeploySection } from "@/components/landing/deploy-section"
import { TechStack } from "@/components/landing/tech-stack"
import { CodePreview } from "@/components/landing/code-preview"
import { Pricing } from "@/components/landing/pricing"
import { Community } from "@/components/landing/community"
import { CTASection, Footer } from "@/components/landing/footer"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <CourseShowcase />
      <Features />
      <DeploySection />
      <TechStack />
      <CodePreview />
      <Pricing />
      <Community />
      <CTASection />
      <Footer />
    </main>
  )
}
