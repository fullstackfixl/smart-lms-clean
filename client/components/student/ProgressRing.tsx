"use client"

interface ProgressRingProps {
    percentage: number
    size?: number
    strokeWidth?: number
    color?: string
    bgColor?: string
    showText?: boolean
    className?: string
}

export function ProgressRing({
    percentage,
    size = 56,
    strokeWidth = 5,
    color = "#7c3aed",
    bgColor = "#1e293b",
    showText = true,
    className
}: ProgressRingProps) {
    const r = (size - strokeWidth * 2) / 2
    const circumference = 2 * Math.PI * r
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
            role="progressbar"
            aria-valuenow={Math.round(percentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(percentage)}% complete`}
        >
            <svg width={size} height={size} className="rotate-[-90deg]">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
            </svg>
            {showText && (
                <span
                    className="absolute text-[10px] font-bold"
                    style={{ color, fontSize: size < 44 ? 8 : 10 }}
                >
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    )
}
