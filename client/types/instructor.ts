// Instructor Dashboard Type Definitions

export interface Course {
  _id: string
  title: string
  description: string
  instructor_id: string
  organization_id: string
  thumbnail?: string
  price: number
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  students?: string[]
  createdAt: string
  updatedAt: string
  is_deleted: boolean
}

export interface Section {
  _id: string
  course_id: string
  title: string
  description?: string
  order: number
  isActive: boolean
  createdAt: string
}

export interface Lesson {
  _id: string
  course_id: string
  section_id: string
  title: string
  description?: string
  type: 'video' | 'text' | 'pdf' | 'quiz'
  content: {
    video_url?: string
    text_content?: string
    pdf_url?: string
    duration?: number
  }
  order: number
  duration: number
  isPreview: boolean
  prerequisites: string[]
  isActive: boolean
  createdAt: string
}

export interface Student {
  _id: string
  name: string
  email: string
  profile?: {
    avatar?: string
    phone?: string
  }
  enrolledAt: string
  progress?: {
    completionPercentage: number
    totalTimeSpent: number
    lastAccessedAt: string
  }
  status: 'active' | 'inactive' | 'suspended'
}

export interface Enrollment {
  _id: string
  student_id: Student
  course_id: string
  organization_id: string
  status: 'active' | 'completed' | 'dropped'
  progress: {
    completionPercentage: number
    completedLessons: string[]
    totalTimeSpent: number
    lastAccessedAt: string
  }
  enrolledAt: string
}

export interface Quiz {
  _id: string
  course_id: string
  instructor_id: string
  title: string
  description?: string
  questions: QuizQuestion[]
  duration_minutes: number
  pass_percentage: number
  shuffle_questions: boolean
  shuffle_options: boolean
  max_attempts: number
  is_active: boolean
  createdAt: string
}

export interface QuizQuestion {
  _id?: string
  type: 'mcq' | 'true_false' | 'fill_blank'
  question: string
  options?: string[]
  correct_answer: string | string[]
  points: number
  explanation?: string
}

export interface QuizAttempt {
  _id: string
  quiz_id: string
  student_id: Student
  course_id: string
  answers: any[]
  score: number
  percentage: number
  passed: boolean
  time_taken: number
  submitted_at: string
}

export interface Attendance {
  _id: string
  student_id: string
  course_id: string
  class_date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  marked_by: string
  notes?: string
  createdAt: string
}

export interface Grade {
  _id: string
  student_id: string
  course_id: string
  assignment_id?: string
  quiz_id?: string
  score: number
  max_score: number
  percentage: number
  grade_letter?: string
  feedback?: string
  graded_by: string
  graded_at: string
}

export interface LiveClass {
  _id: string
  title: string
  description?: string
  course_id: {
    _id: string
    title: string
  }
  instructor_id: string
  organization_id: string
  scheduled_date: string
  start_time: string
  duration_minutes: number
  meeting_url?: string
  meeting_room_id?: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  recording_url?: string
  attendance_marked: boolean
  createdAt: string
}

export interface InstructorStats {
  totalCourses: number
  totalStudents: number
  publishedCourses: number
  draftCourses: number
  upcomingLiveClasses: number
  averageCompletion: number
  totalEnrollments: number
}

export interface CourseAnalytics {
  course_id: string
  totalEnrollments: number
  activeStudents: number
  completionRate: number
  averageProgress: number
  averageTimeSpent: number
  quizPerformance: {
    averageScore: number
    passRate: number
    totalAttempts: number
  }
  engagementMetrics: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
  }
}

export interface StudentProgress {
  student_id: string
  course_id: string
  completionPercentage: number
  completedLessons: string[]
  currentLesson?: string
  totalTimeSpent: number
  lastAccessedAt: string
  quizScores: {
    quiz_id: string
    score: number
    percentage: number
  }[]
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// Form Types
export interface CourseFormData {
  title: string
  description: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  price: number
  thumbnail?: string
  tags: string[]
}

export interface LessonFormData {
  title: string
  description?: string
  type: 'video' | 'text' | 'pdf' | 'quiz'
  content: {
    video_url?: string
    text_content?: string
    pdf_url?: string
    duration?: number
  }
  duration: number
  isPreview: boolean
  order: number
}

export interface QuizFormData {
  title: string
  description?: string
  course_id: string
  duration_minutes: number
  pass_percentage: number
  shuffle_questions: boolean
  shuffle_options: boolean
  max_attempts: number
  questions: QuizQuestion[]
}

export interface AttendanceFormData {
  course_id: string
  class_date: string
  students: {
    student_id: string
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
  }[]
}

export interface GradeFormData {
  student_id: string
  course_id: string
  assignment_id?: string
  quiz_id?: string
  score: number
  max_score: number
  feedback?: string
}
