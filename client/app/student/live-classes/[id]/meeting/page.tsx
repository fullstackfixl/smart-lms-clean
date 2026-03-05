"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Video, Loader2, ChevronLeft, ShieldAlert } from "lucide-react"
import { Button } from "../../../../../components/ui/button"
import { Card, CardContent } from "../../../../../components/ui/card"
import { toast } from "sonner"
import { API_URL } from "../../../../../lib/config"

declare global {
    interface Window {
        JitsiMeetExternalAPI: any
    }
}

const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

const getUser = () => {
    if (typeof window === "undefined") return null
    const u = window.sessionStorage.getItem("instatute_user") || window.localStorage.getItem("instatute_user")
    return u ? JSON.parse(u) : null
}

export default function MeetingPage() {
    const { id } = useParams()
    const router = useRouter()
    const jitsiContainerRef = useRef<HTMLDivElement>(null)
    const apiRef = useRef<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [classInfo, setClassInfo] = useState<any>(null)
    const user = getUser()

    // Fetch class info to get meeting room ID
    useEffect(() => {
        const fetchClass = async () => {
            try {
                const r = await fetch(`${API_URL}/live-classes/${id}`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                    credentials: "include"
                })
                const data = await r.json()
                if (data.success) {
                    setClassInfo(data.data)
                } else {
                    setError(data.message || "Failed to load class details")
                }
            } catch {
                setError("Network error")
            } finally {
                setLoading(false)
            }
        }
        fetchClass()
    }, [id])

    // Load Jitsi script
    useEffect(() => {
        if (!classInfo) return

        const script = document.createElement("script")
        script.src = `https://${process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si"}/external_api.js`
        script.async = true
        script.onload = () => initJitsi()
        document.body.appendChild(script)

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose()
            }
            document.body.removeChild(script)
        }
    }, [classInfo])

    const initJitsi = () => {
        if (!jitsiContainerRef.current || !classInfo) return

        const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si"
        const options = {
            roomName: classInfo.meeting_room_id,
            width: "100%",
            height: "100%",
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: user?.full_name || user?.name || "Participant",
                email: user?.email || ""
            },
            configOverwrite: {
                prejoinPageEnabled: false,
                disableInviteFunctions: true
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false
            }
        }

        const api = new window.JitsiMeetExternalAPI(domain, options)
        apiRef.current = api

        // Event listeners
        api.addEventListeners({
            videoConferenceJoined: handleJoined,
            videoConferenceLeft: handleLeft,
            participantJoined: (e: any) => console.log("Participant joined", e),
            participantLeft: (e: any) => console.log("Participant left", e)
        })
    }

    const handleJoined = async () => {
        if (!user || user.role !== 'student') return
        try {
            await fetch(`${API_URL}/attendance/join`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    studentId: user._id,
                    classId: id,
                    courseId: classInfo.course_id?._id || classInfo.course_id,
                    joinTime: new Date().toISOString()
                })
            })
        } catch (err) {
            console.error("Failed to record join event", err)
        }
    }

    const handleLeft = async () => {
        if (!user || user.role !== 'student') return
        try {
            await fetch(`${API_URL}/attendance/leave`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    studentId: user._id,
                    classId: id,
                    leaveTime: new Date().toISOString()
                })
            })
        } catch (err) {
            console.error("Failed to record leave event", err)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                <p className="text-slate-500 font-medium">Setting up your secure meeting space...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
                <Card className="max-w-md w-full border-red-100 shadow-xl shadow-red-50">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
                        <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldAlert className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                        <p className="text-slate-500 mb-8">{error}</p>
                        <Button onClick={() => router.back()} variant="outline" className="gap-2">
                            <ChevronLeft className="h-4 w-4" /> Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-slate-950">
            {/* Mini Header */}
            <div className="h-14 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" /> Exit
                    </Button>
                    <div className="h-4 w-px bg-slate-700 mx-1" />
                    <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-bold text-slate-200 truncate max-w-[200px] md:max-w-md">
                            {classInfo?.title}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="hidden md:inline text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        Live Stream
                    </span>
                </div>
            </div>

            {/* Meeting Body */}
            <div className="flex-1 relative">
                <div ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
            </div>
        </div>
    )
}
