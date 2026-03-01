"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, Loader2 } from "lucide-react"
import { Button } from '../../components/ui/button'
import { toast } from "sonner"

const plans = [
    {
        name: "Basic",
        price: "$29",
        description: "Perfect for small tutoring centers",
        features: [
            "Up to 50 students",
            "Core LMS features",
            "Email support",
            "Standard analytics"
        ],
        id: "basic"
    },
    {
        name: "Pro",
        price: "$99",
        description: "Ideal for growing schools",
        features: [
            "Up to 500 students",
            "Advanced course tools",
            "Priority support",
            "Detailed reporting",
            "Custom subdomain"
        ],
        id: "pro",
        highlight: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For large institutions",
        features: [
            "Unlimited students",
            "White-labeling",
            "API access",
            "Dedicated account manager",
            "SLA guarantee"
        ],
        id: "enterprise"
    }
]

export default function PricingPage() {
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const handleSubscribe = (planId: string) => {
        setLoading(planId)
        // 2 second loading animation simulation as requested
        setTimeout(() => {
            setLoading(null)
            router.push(`/apply?plan=${planId}`)
        }, 2000)
    }

    return (
        <div className="min-h-screen bg-background py-20 px-4">
            <div className="max-w-6xl mx-auto text-center">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-extrabold text-foreground mb-4"
                >
                    Choose Your Plan
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-muted-foreground mb-16"
                >
                    Scale your institution with Smart LMS
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col p-8 rounded-2xl border ${plan.highlight
                                    ? "border-primary shadow-xl shadow-primary/10 bg-primary/5"
                                    : "border-border bg-card"
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                    MOST POPULAR
                                </div>
                            )}

                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-4xl font-extrabold">{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-muted-foreground">/mo</span>}
                            </div>
                            <p className="text-muted-foreground mb-8 text-sm">{plan.description}</p>

                            <ul className="space-y-4 mb-10 flex-grow text-left">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm">
                                        <Check className="h-5 w-5 text-primary shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleSubscribe(plan.id)}
                                variant={plan.highlight ? "default" : "outline"}
                                disabled={loading !== null}
                                className="w-full py-6 text-lg font-bold"
                            >
                                {loading === plan.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                    "Subscribe Now"
                                )}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
