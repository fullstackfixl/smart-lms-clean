"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Key, Loader2, Copy, Check } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'

export default function StudentParentCodePage() {
    const { user, token } = useAuth()
    const [code, setCode] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const generateCode = async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/parent/generate-code`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            const data = await res.json()
            if (data.success) {
                setCode(data.data.code)
                toast.success("Verification code generated!")
            } else {
                toast.error(data.message || "Failed to generate code")
            }
        } catch (e) {
            toast.error("Network error")
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (code) {
            navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success("Code copied to clipboard")
        }
    }

    return (
        <div className="container mx-auto py-12 max-w-xl">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Key className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">Connect a Parent</CardTitle>
                    <CardDescription>
                        Generate a verification code to allow your parents to link to your account and track your progress.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-8 py-8">
                    {code ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center w-full"
                        >
                            <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Your Verification Code</p>
                            <div className="group relative flex items-center justify-center gap-4 py-6 px-8 bg-secondary rounded-2xl border-2 border-primary/20">
                                <span className="text-5xl font-bold tracking-[0.5rem] font-mono text-primary">{code}</span>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                                >
                                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                                </button>
                            </div>
                            <p className="mt-6 text-sm text-amber-600 dark:text-amber-400 font-medium">
                                This code will expire in 24 hours.
                            </p>
                        </motion.div>
                    ) : (
                        <Button size="lg" onClick={generateCode} disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate New Code
                        </Button>
                    )}

                    <div className="w-full pt-6 border-t border-border">
                        <h4 className="text-sm font-semibold mb-3">How it works:</h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-4">
                            <li>Click the button above to generate a secure 6-digit code.</li>
                            <li>Share this code with your parent or guardian.</li>
                            <li>They can enter it in their Parent Dashboard to connect.</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
