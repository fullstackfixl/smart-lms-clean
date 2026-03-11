"use client"

import { useState, useCallback } from "react"
import { Upload, File, X, Check, Cloud } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Progress } from '../../../components/ui/progress'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"

interface UploadingFile {
  id: string
  name: string
  size: number
  progress: number
  status: "uploading" | "completed" | "error"
}

export default function InstructorUploadPage() {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    handleFiles(selectedFiles)
  }

  const handleFiles = (newFiles: File[]) => {
    const uploadingFiles: UploadingFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading"
    }))

    setFiles(prev => [...prev, ...uploadingFiles])

    // Simulate upload progress
    uploadingFiles.forEach(file => {
      simulateUpload(file.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: 100, status: "completed" } : f
        ))
        toast.success("File uploaded successfully")
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress } : f
        ))
      }
    }, 300)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Content</h1>
        <p className="text-slate-500 mt-1">Upload videos, documents, and other course materials.</p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-md p-12 text-center transition-colors",
          isDragging 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <Cloud className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-lg font-medium text-slate-900 mb-2">
          Drag and drop files here
        </p>
        <p className="text-sm text-slate-500 mb-4">
          or click to browse from your computer
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input">
          <Button variant="outline" className="cursor-pointer" asChild>
            <span>Select Files</span>
          </Button>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
          <h3 className="font-medium text-slate-900">Uploading Files</h3>
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-md">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <File className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
                <div className="mt-2">
                  <Progress value={file.progress} className="h-2" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.status === "completed" ? (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">{Math.round(file.progress)}%</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-slate-50 border border-gray-200 rounded-md p-4">
        <h3 className="font-medium text-slate-900 mb-2">Upload Guidelines</h3>
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li>Maximum file size: 500MB per file</li>
          <li>Supported formats: MP4, PDF, DOC, DOCX, PPT, PPTX</li>
          <li>Videos should be in MP4 format with H.264 encoding</li>
          <li>Ensure you have rights to upload all content</li>
        </ul>
      </div>
    </div>
  )
}
