"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, LogOut, GraduationCap } from "lucide-react"

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

        // Load students and filter by department
        const students = JSON.parse(localStorage.getItem("students") || "[]")
        const deptStudents = students.filter((s: any) => s.department === decodedDept)

        // Count students by year
        const yearCounts: Record<"I" | "II" | "III", number> = {
            I: 0,
            II: 0,
            III: 0
        }

        deptStudents.forEach((student: any) => {
            if (student.year === "I" || student.year === "II" || student.year === "III") {
                yearCounts[student.year as "I" | "II" | "III"]++
            }
        })

        const stats: YearStats[] = [
            { year: "I", studentCount: yearCounts.I },
            { year: "II", studentCount: yearCounts.II },
            { year: "III", studentCount: yearCounts.III }
        ]

        setYearStats(stats)
    }, [session, status, router, unwrappedParams.department])

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
            case "I": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
            case "II": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
            case "III": return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
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
                                <h1 className="text-2xl font-semibold">{departmentName} - Select Year</h1>
                                <p className="text-sm text-muted-foreground">
                                    Choose a year to view student credentials
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid gap-6 md:grid-cols-3">
                    {yearStats.map((stat) => (
                        <Card
                            key={stat.year}
                            className={`cursor-pointer hover:shadow-md transition-shadow border-2 ${getYearColor(stat.year)}`}
                            onClick={() => router.push(`/dashboard/admin/credentials?department=${encodeURIComponent(departmentName)}&year=${stat.year}`)}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    {getYearLabel(stat.year)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold mb-2">{stat.studentCount}</div>
                                <p className="text-sm opacity-80">
                                    {stat.studentCount === 1 ? "Student" : "Students"}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {yearStats.every(s => s.studentCount === 0) && (
                    <Card className="mt-6">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No students found in {departmentName} department.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
