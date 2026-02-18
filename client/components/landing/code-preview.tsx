"use client"

import { useState } from "react"
import { motion } from "framer-motion"

const tabs = [
  {
    label: "JavaScript",
    code: `import Instatute from '@instatute/sdk';

const lms = new Instatute({
  apiKey: process.env.INSTATUTE_API_KEY,
  orgId: 'org_12345'
});

// Enroll a student in a course
const enrollment = await lms.enrollments.create({
  student_id: 'student_001',
  course_id: 'course_react_101',
});

// Track progress automatically
await lms.progress.update({
  lesson_id: 'lesson_05',
  completed: true,
  watch_time: 1200
});

// Get AI-powered recommendations
const recs = await lms.ai.recommend('student_001');
console.log(recs.courses);`,
  },
  {
    label: "Python",
    code: `from instatute import Instatute

lms = Instatute(
    api_key=os.environ["INSTATUTE_API_KEY"],
    org_id="org_12345"
)

# Create a course with sections
course = lms.courses.create(
    title="React Masterclass",
    category="Web Development",
    price=49.99,
    instructor_id="inst_001"
)

# Add AI-generated quiz
quiz = lms.ai.generate_quiz(
    content=lesson.content,
    num_questions=10,
    difficulty="intermediate"
)

# Predictive analytics
analytics = lms.analytics.predict("student_001")
print(analytics.completion_probability)`,
  },
  {
    label: "REST API",
    code: `# Create a new course
curl -X POST https://api.instatute.io/api/courses \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Advanced JavaScript",
    "description": "Master modern JS",
    "category": "Programming",
    "price": 79.99
  }'

# Enroll a student
curl -X POST https://api.instatute.io/api/enrollments \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{ "course_id": "course_id_here" }'

# Get leaderboard
curl https://api.instatute.io/api/gamification/leaderboard \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
  },
]

export function CodePreview() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section id="resources" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Start building in <span className="text-gradient-primary">minutes</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Integrate Instatute into your existing systems with our SDK and REST API.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex border-b border-border">
            {tabs.map((tab, i) => (
              <button
                type="button"
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === i
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto p-6">
            <pre className="font-mono text-sm leading-relaxed text-muted-foreground">
              <code>
                {tabs[activeTab].code.split("\n").map((line, i) => (
                  <div key={`${activeTab}-${i}`} className="flex">
                    <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground/30">
                      {i + 1}
                    </span>
                    <span
                      className={
                        line.startsWith("//") || line.startsWith("#")
                          ? "text-muted-foreground/50"
                          : line.includes("await") || line.includes("const") || line.includes("import") || line.includes("from") || line.includes("def") || line.includes("curl")
                            ? "text-primary"
                            : line.includes("'") || line.includes('"')
                              ? "text-accent"
                              : "text-foreground/80"
                      }
                    >
                      {line || " "}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </motion.div>
      </div>
    </section>
  )
}