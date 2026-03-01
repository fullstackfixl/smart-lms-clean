"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, CheckCircle, XCircle } from "lucide-react"
import { PageHeader } from '../../../components/instructor/page-header'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Card } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { cn } from '../../../lib/utils'

export default function UploadContentPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file upload
    console.log('File dropped')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file selection
    console.log('File selected')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader title="Upload Video Lecture" />

      <Card className="p-6 border border-gray-200 dark:border-slate-700">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select Course
          </label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Advanced React Development</SelectItem>
              <SelectItem value="2">Introduction to TypeScript</SelectItem>
              <SelectItem value="3">Node.js Backend Mastery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Upload Steps:
          </h3>
          <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">1.</span>
              <span>Select the course from the dropdown above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">2.</span>
              <span>Choose or drag a video file (MP4, MOV, AVI supported)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">3.</span>
              <span>Add lecture title and description</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400">4.</span>
              <span>Upload and process</span>
            </li>
          </ol>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
            isDragging
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
          )}
        >
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Drag and drop video file here
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              or click to browse
            </p>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <span>Choose File</span>
              </Button>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Maximum file size: 2GB
            </p>
          </div>
        </div>

        {uploadProgress !== null && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Uploading...
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {uploadProgress}%
              </span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Upload successful!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your video is being processed and will be available soon.
              </p>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Upload failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                There was an error uploading your file. Please try again.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Retry
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
