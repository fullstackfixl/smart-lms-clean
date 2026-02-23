"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const videos = [
    "https://res.cloudinary.com/dzgkmnbtj/video/upload/v1770444042/hero-video1_f99lgh.mp4",
    "https://res.cloudinary.com/dzgkmnbtj/video/upload/v1770443792/hero-video_qwgecv.mp4",
    "https://res.cloudinary.com/dzgkmnbtj/video/upload/v1770443760/602601_Cities_City_3840x2160_wv09c1.mp4",
]

export function VideoBackground() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % videos.length)
        }, 10000) // rotate every 10 seconds
        return () => clearInterval(timer)
    }, [])

    if (!mounted) return null

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover"
                        key={videos[currentIndex]}
                    >
                        <source src={videos[currentIndex]} type="video/mp4" />
                    </video>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

