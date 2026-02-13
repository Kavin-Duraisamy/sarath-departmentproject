"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export function TokenSync() {
    const { data: session } = useSession()

    useEffect(() => {
        if ((session as any)?.accessToken) {
            console.log("[TokenSync] Syncing accessToken to localStorage")
            localStorage.setItem("accessToken", (session as any).accessToken)
        }
    }, [session])

    return null
}
