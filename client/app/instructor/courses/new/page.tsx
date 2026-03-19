"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, CheckCircle2, Layers3, Sparkles } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Textarea } from "../../../../components/ui/textarea"
import { Label } from "../../../../components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select"
import { toast } from "sonner"
import { useAuth } from "../../../../lib/auth-context"
import { instructorApi } from "../../../../lib/api"
import { cn } from "../../../../lib/utils"

const CATEGORY_OPTIONS = [
  "Programming",
  "Design",
  "Marketing",
  "Business",
  "Mathematics",
  "Science",
  "Language",
  "General",
]

export default function CreateCoursePage() {
  const router = useRouter()
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    price: "0",
    language: "English",
    tags: "",
  })

  const titleLength = formData.title.trim().length
  const descriptionLength = formData.description.trim().length
  const isValid =
    titleLength >= 6 &&
    descriptionLength >= 30 &&
    formData.category.trim().length > 0 &&
    Number(formData.price) >= 0

  const tagPreview = useMemo(
    () =>
      formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 6),
    [formData.tags]
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!token) {
      toast.error("Please login first")
      router.push("/login")
      return
    }

    if (!isValid) {
      toast.error("Please complete the required course details")
      return
    }

    setLoading(true)
    try {
      const response = await instructorApi.createCourse(token, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        level: formData.level,
        price: parseFloat(formData.price) || 0,
        language: formData.language.trim() || "English",
        tags: tagPreview,
        status: "draft",
        isPublished: false,
      })

      if (!response.success) {
        toast.error(response.error || "Failed to create course")
        return
      }

      toast.success("Course created. Next, add modules and lessons.")
      const courseId = (response.data as any)?._id || (response.data as any)?.course?._id
      router.push(courseId ? `/instructor/courses/${courseId}` : "/instructor/courses")
    } catch (error) {
      console.error("Create course error:", error)
      toast.error("Failed to create course")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()} className="h-10 w-10 p-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Course Builder</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create A New Course</h1>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                Instructor Workflow
              </span>
              <h2 className="mt-4 text-2xl font-bold">Set up the course shell first</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Add the core information here. After saving, you can open the course page to build modules, lessons, quizzes, and submit it for review.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="e.g., Introduction to Web Development"
                  className="mt-2 h-11"
                  required
                />
                <p className={cn("mt-2 text-xs", titleLength >= 6 ? "text-green-600" : "text-slate-500")}>
                  {titleLength}/6 minimum characters
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder="Explain the learner outcome, who the course is for, and how the content is structured."
                  className="mt-2 min-h-[140px]"
                  required
                />
                <p className={cn("mt-2 text-xs", descriptionLength >= 30 ? "text-green-600" : "text-slate-500")}>
                  {descriptionLength}/30 minimum characters
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                    placeholder="Choose or type a category"
                    className="mt-2 h-11"
                    required
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData({ ...formData, category })}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          formData.category === category
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger className="mt-2 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(event) => setFormData({ ...formData, price: event.target.value })}
                    placeholder="0.00"
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(event) => setFormData({ ...formData, language: event.target.value })}
                    placeholder="English"
                    className="mt-2 h-11"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(event) => setFormData({ ...formData, tags: event.target.value })}
                  placeholder="javascript, frontend, html"
                  className="mt-2 h-11"
                />
                <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                  {tagPreview.length > 0 ? (
                    tagPreview.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Separate tags with commas to improve discovery later.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">What happens next</h2>
                <p className="text-sm text-slate-500">The builder stays simple here on purpose.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white p-2 text-blue-600 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">1. Save the course draft</p>
                    <p className="text-xs leading-5 text-slate-500">We create the course shell and keep it private while you build.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white p-2 text-orange-600 shadow-sm">
                    <Layers3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">2. Add modules and lessons</p>
                    <p className="text-xs leading-5 text-slate-500">Use the course page to build structure, media, quizzes, and announcements.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white p-2 text-green-600 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">3. Submit for admin approval</p>
                    <p className="text-xs leading-5 text-slate-500">Once ready, send it to the org admin review queue for publishing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Course quality checklist</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Clear title that matches the learner outcome.</li>
              <li>Description explains value, audience, and structure.</li>
              <li>Category and level help students find the right course.</li>
              <li>Price is set intentionally, or kept free for internal training.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
