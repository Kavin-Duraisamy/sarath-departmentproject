"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import { TokenSync } from "@/components/token-sync"

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <TokenSync />
            {children}
            <Toaster />
        </SessionProvider>
    )
}
