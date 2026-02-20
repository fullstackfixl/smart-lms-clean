"use client"

import { Card, CardContent } from "@/components/ui/card"

interface SkeletonCardProps {
    variant?: "course" | "stat" | "lesson"
    count?: number
}

function Shimmer({ className }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-slate-800 rounded ${className}`}
            aria-hidden="true"
        />
    )
}

function CourseCardSkeleton() {
    return (
        <Card className="overflow-hidden border border-slate-800 bg-slate-900/80">
            <Shimmer className="aspect-video rounded-none" />
            <CardContent className="p-4 space-y-3">
                <Shimmer className="h-4 w-2/3" />
                <Shimmer className="h-3 w-full" />
                <Shimmer className="h-3 w-4/5" />
                <Shimmer className="h-2 w-1/3" />
                <Shimmer className="h-8 w-full mt-2" />
            </CardContent>
        </Card>
    )
}

function StatSkeleton() {
    return (
        <Card className="border border-slate-800 bg-slate-900/80 p-4">
            <div className="space-y-2">
                <Shimmer className="h-8 w-12" />
                <Shimmer className="h-3 w-24" />
            </div>
        </Card>
    )
}

function LessonSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg">
            <Shimmer className="h-5 w-5 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-2 w-1/4" />
            </div>
        </div>
    )
}

export function SkeletonCard({ variant = "course", count = 1 }: SkeletonCardProps) {
    const items = Array.from({ length: count }, (_, i) => i)
    if (variant === "stat") return <>{items.map(i => <StatSkeleton key={i} />)}</>
    if (variant === "lesson") return <>{items.map(i => <LessonSkeleton key={i} />)}</>
    return <>{items.map(i => <CourseCardSkeleton key={i} />)}</>
}
