import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    // Session check disabled for frontend-only mode
    /*
    const session = await auth()
    if (!session?.user) {
        redirect("/")
    }
    const role = session.user.role?.toLowerCase()
    if (role) {
        redirect(`/dashboard/${role}`)
    }
    */

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
    )
}
