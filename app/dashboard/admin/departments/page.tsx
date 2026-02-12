"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, LogOut, Building2 } from "lucide-react"

interface Department {
    name: string
    studentCount: number
}

export default function DepartmentsPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<any>(null)
    const [departments, setDepartments] = useState<Department[]>([])

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

        // Load students and extract unique departments
        const students = JSON.parse(localStorage.getItem("students") || "[]")

        // Group by department and count
        const departmentMap = new Map<string, number>()
        students.forEach((student: any) => {
            const dept = student.department || "Unknown"
            departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1)
        })

        // Convert to array and sort
        const deptArray = Array.from(departmentMap.entries()).map(([name, count]) => ({
            name,
            studentCount: count
        })).sort((a, b) => a.name.localeCompare(b.name))

        setDepartments(deptArray)
    }, [session, status, router])

    const handleLogout = () => {
        signOut({ callbackUrl: "/" })
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
                            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/admin")}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div>
                                <h1 className="text-2xl font-semibold">Student Credentials by Department</h1>
                                <p className="text-sm text-muted-foreground">
                                    Select a department to view student credentials
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
                {departments.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No students found. Add students from the HOD dashboard first.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {departments.map((dept) => (
                            <Card
                                key={dept.name}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => router.push(`/dashboard/admin/departments/${encodeURIComponent(dept.name)}`)}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        {dept.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold mb-2">{dept.studentCount}</div>
                                    <p className="text-sm text-muted-foreground">
                                        {dept.studentCount === 1 ? "Student" : "Students"}
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
