import { Manrope, Space_Grotesk } from 'next/font/google'

import { SmartLmsLanding } from '../components/landing/SmartLmsLanding'

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
})

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata = {
  title: 'Smart LMS | Education Operating System for Colleges and Institutes',
  description:
    'Smart LMS helps colleges, institutes, and academies manage academic operations, publish courses, run live learning, and deliver a polished student experience.',
  openGraph: {
    title: 'Smart LMS | Education Operating System',
    description:
      'Run departments, batches, courses, live classes, quizzes, and student delivery from one modern LMS platform.',
    type: 'website',
  },
}

export default function Page() {
  return (
    <div className={`${bodyFont.variable} ${headingFont.variable} font-sans`}>
      <SmartLmsLanding />
    </div>
  )
}
