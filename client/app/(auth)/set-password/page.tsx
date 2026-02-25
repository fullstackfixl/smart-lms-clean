"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

/**
 * This page acts as an alias for /accept-invite.
 * It ensures that legacy invitation links (using /set-password) continue to work.
 */
export default function SetPasswordAlias() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    useEffect(() => {
        // Redirect to the canonical /accept-invite route
        if (token) {
            router.replace(`/accept-invite?token=${token}`)
        } else {
            router.replace("/login")
        }
    }, [token, router])

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 text-center"
            >
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h1 className="text-xl font-semibold">Redirecting to account setup...</h1>
                <p className="text-muted-foreground">Please wait while we prepare your activation page.</p>
            </motion.div>
        </div>
    )
}
