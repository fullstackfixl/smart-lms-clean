import { SmartLmsLanding } from '../components/landing/SmartLmsLanding'

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
    <SmartLmsLanding />
  )
}
