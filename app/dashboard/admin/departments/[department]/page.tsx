"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, LogOut, GraduationCap } from "lucide-react"
import { apiClient } from "@/lib/api"

interface YearStats {
    year: "I" | "II" | "III"
    studentCount: number
}

export default function DepartmentDetailPage({ params }: { params: Promise<{ department: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<any>(null)
    const [departmentName, setDepartmentName] = useState<string>("")
    const [yearStats, setYearStats] = useState<YearStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        const userData = session?.user
        if (!userData || userData.role !== "admin") {
            if (userData?.role) router.push(`/dashboard/${userData.role}`)
            else router.push("/")
            return
        }

        setUser(userData)

        // Decode department name from URL
        const decodedDept = decodeURIComponent(unwrappedParams.department)
        setDepartmentName(decodedDept)
        fetchYearStats(decodedDept)
    }, [session, status, router, unwrappedParams.department])

    const fetchYearStats = async (deptName: string) => {
        try {
            setLoading(true)
            // Fetch all students of this department
            const res = await apiClient.getStudents({ department: deptName })
            const students = res.data

            const yearCounts: Record<"I" | "II" | "III", number> = {
                I: 0,
                II: 0,
                III: 0
            }

            students.forEach((student: any) => {
                if (student.year === "I" || student.year === "II" || student.year === "III") {
                    yearCounts[student.year as "I" | "II" | "III"]++
                }
            })

            setYearStats([
                { year: "I", studentCount: yearCounts.I },
                { year: "II", studentCount: yearCounts.II },
                { year: "III", studentCount: yearCounts.III }
            ])
        } catch (error) {
            console.error("Failed to fetch year stats", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        signOut({ callbackUrl: "/" })
    }

    const getYearLabel = (year: string) => {
        switch (year) {
            case "I": return "First Year"
            case "II": return "Second Year"
            case "III": return "Third Year"
            default: return year
        }
    }

    const getYearColor = (year: string) => {
        switch (year) {
            case "I": return "border-green-500/20 hover:bg-green-50/50 dark:hover:bg-green-950/20"
            case "II": return "border-blue-500/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
            case "III": return "border-purple-500/20 hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
            default: return ""
        }
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/admin/departments")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Departments
                            </Button>
                            <div>
                                <h1 className="text-2xl font-semibold">{departmentName}</h1>
                                <p className="text-sm text-muted-foreground">Select a year to view credentials</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-3">
                        {yearStats.map((stat) => (
                            <Card
                                key={stat.year}
                                className={`cursor-pointer transition-all hover:scale-105 border-2 ${getYearColor(stat.year)}`}
                                onClick={() => router.push(`/dashboard/admin/credentials?department=${encodeURIComponent(departmentName)}&year=${stat.year}`)}
                            >
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-2">
                                        <GraduationCap className="h-8 w-8 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl font-bold">{getYearLabel(stat.year)}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="text-5xl font-extrabold mb-1">{stat.studentCount}</div>
                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                                        {stat.studentCount === 1 ? "Student" : "Students"}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
