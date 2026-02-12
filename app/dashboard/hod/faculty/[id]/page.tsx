"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, GraduationCap, TrendingUp, BookOpen, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Faculty = {
    id: string
    name: string
    email: string
    department: string
    phone: string
    subjects: string[]
    assignedYears: string[]
    username: string
    classesCount?: number
    feedbackScore?: number
    projectsSupervised?: number
}

export default function FacultyProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params)
    const router = useRouter()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<any>(null)
    const [faculty, setFaculty] = useState<Faculty | null>(null)
    const [students, setStudents] = useState<any[]>([])
    const [notifications, setNotifications] = useState<any[]>([])

    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        const userData = session?.user
        if (!userData || userData.role !== "hod") {
            if (userData?.role) router.push(`/dashboard/${userData.role}`)
            else router.push("/")
            return
        }

        setUser(userData)

        // Load faculty data
        const storedFaculty = localStorage.getItem("faculty")
        if (storedFaculty) {
            const allFaculty = JSON.parse(storedFaculty)
            const facultyMember = allFaculty.find((f: Faculty) => f.id === unwrappedParams.id)
            if (facultyMember) {
                setFaculty(facultyMember)

                // Load students for this faculty's department and years
                const storedStudents = localStorage.getItem("students")
                if (storedStudents) {
                    const allStudents = JSON.parse(storedStudents)
                    const facultyStudents = allStudents.filter((s: any) =>
                        s.department === facultyMember.department &&
                        facultyMember.assignedYears.includes(s.year)
                    )
                    setStudents(facultyStudents)
                }

                // Load notifications for this faculty
                const storedNotifications = localStorage.getItem("facultyNotifications")
                if (storedNotifications) {
                    const allNotifications = JSON.parse(storedNotifications)
                    const facultyNotifications = allNotifications.filter((n: any) =>
                        n.facultyId === facultyMember.id || n.facultyId === 'all'
                    )
                    setNotifications(facultyNotifications)
                }
            } else {
                router.push("/dashboard/hod/faculty")
            }
        }
    }, [session, status, router, unwrappedParams.id])

    const getPerformanceBadge = (score: number) => {
        if (score >= 4.5) return { label: "Excellent", color: "bg-green-500/10 text-green-700" }
        if (score >= 3.5) return { label: "Good", color: "bg-blue-500/10 text-blue-700" }
        return { label: "Average", color: "bg-gray-500/10 text-gray-700" }
    }

    const getYearBadgeColor = (year: string) => {
        switch (year) {
            case "I": return "bg-green-500/10 text-green-700"
            case "II": return "bg-blue-500/10 text-blue-700"
            case "III": return "bg-purple-500/10 text-purple-700"
            default: return ""
        }
    }

    if (!user || !faculty) {
        return null
    }

    const performance = getPerformanceBadge(faculty.feedbackScore || 0)

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/hod/faculty")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Faculty
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Profile Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <CardTitle className="text-2xl">{faculty.name}</CardTitle>
                                    {faculty.feedbackScore && faculty.feedbackScore > 0 && (
                                        <Badge className={performance.color}>{performance.label}</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">{faculty.department} Department</p>
                            </div>
                            <div className="flex gap-2">
                                {faculty.assignedYears.map((year) => (
                                    <Badge key={year} className={getYearBadgeColor(year)}>
                                        Year {year}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{faculty.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{faculty.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Username</p>
                                    <p className="font-medium">{faculty.username}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Classes Conducted</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{faculty.classesCount || 0}</div>
                            <p className="text-xs text-muted-foreground">Total classes this semester</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Feedback Rating</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {faculty.feedbackScore ? `${faculty.feedbackScore}/5` : "N/A"}
                            </div>
                            <p className="text-xs text-muted-foreground">Average student rating</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projects Supervised</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{faculty.projectsSupervised || 0}</div>
                            <p className="text-xs text-muted-foreground">Active and completed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="subjects" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="subjects">Subjects</TabsTrigger>
                        <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications ({notifications.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="subjects" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Subjects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {faculty.subjects.map((subject) => (
                                        <Badge key={subject} variant="secondary" className="text-sm py-2 px-3">
                                            {subject}
                                        </Badge>
                                    ))}
                                </div>
                                {faculty.subjects.length === 0 && (
                                    <p className="text-muted-foreground text-sm">No subjects assigned yet</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="students" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Students</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {students.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No students in assigned years</p>
                                ) : (
                                    <div className="space-y-4">
                                        {faculty.assignedYears.map((year) => {
                                            const yearStudents = students.filter(s => s.year === year)
                                            if (yearStudents.length === 0) return null

                                            return (
                                                <div key={year}>
                                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                                        <Badge className={getYearBadgeColor(year)}>Year {year}</Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            ({yearStudents.length} students)
                                                        </span>
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {yearStudents.map((student) => (
                                                            <div
                                                                key={student.id}
                                                                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                                                onClick={() => router.push(`/dashboard/hod/students/${student.id}`)}
                                                            >
                                                                <p className="font-medium">{student.name}</p>
                                                                <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Communication History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {notifications.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No notifications sent yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className="p-4 border rounded-lg space-y-2"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{notification.title}</h4>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                    <Badge variant={notification.type === 'broadcast' ? 'default' : 'secondary'}>
                                                        {notification.type === 'broadcast' ? 'Broadcast' : 'Direct'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>From: {notification.sentByName}</span>
                                                    <span>•</span>
                                                    <span>{new Date(notification.sentAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
