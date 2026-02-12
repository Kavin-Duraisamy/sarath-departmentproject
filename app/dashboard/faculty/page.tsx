"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Users, Calendar, BookOpen, LogOut, Bell, GraduationCap,
  ClipboardList, FileText, TrendingUp, Award, MessageSquare,
  Upload, Download, Clock, UserCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function FacultyDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [facultyData, setFacultyData] = useState<any>(null)
  const [stats, setStats] = useState({
    assignedClasses: 0,
    totalStudents: 0,
    pendingProjects: 0,
    todayClasses: 0,
    attendanceMarked: 0,
    unreadNotifications: 0,
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "faculty") {
      if (userData?.role) {
        router.push(`/dashboard/${userData.role}`)
      } else {
        router.push("/")
      }
      return
    }

    setUser(userData)

    // Load faculty data
    try {
      const allFaculty = JSON.parse(localStorage.getItem("faculty") || "[]")
      const faculty = allFaculty.find((f: any) => f.username === userData.email || f.email === userData.email)

      if (faculty) {
        setFacultyData(faculty)

        // Load students
        const students = JSON.parse(localStorage.getItem("students") || "[]")
        const myStudents = students.filter((s: any) =>
          faculty.assignedYears?.includes(s.year) && s.department === faculty.department
        )

        // Load notifications
        const notifications = JSON.parse(localStorage.getItem("facultyNotifications") || "[]")
        const myNotifications = notifications.filter((n: any) =>
          n.facultyId === faculty.id || n.facultyId === 'all'
        )
        const unread = myNotifications.filter((n: any) => !n.read).length

        // Load attendance records
        const attendance = JSON.parse(localStorage.getItem("attendanceRecords") || "[]")
        const todayAttendance = attendance.filter((a: any) =>
          a.facultyId === faculty.id && a.date === new Date().toISOString().split('T')[0]
        )

        // Load projects
        const projects = JSON.parse(localStorage.getItem("projects") || "[]")
        const pendingProjects = projects.filter((p: any) =>
          p.facultyId === faculty.id && p.status === 'submitted'
        ).length

        setStats({
          assignedClasses: faculty.subjects?.length || 0,
          totalStudents: myStudents.length,
          pendingProjects: pendingProjects,
          todayClasses: 4, // Mock data
          attendanceMarked: todayAttendance.length,
          unreadNotifications: unread,
        })
      }
    } catch (e) {
      console.error("Failed to load faculty stats", e)
    }
  }, [session, status, router])

  const handleLogout = async () => {
    const { signOut } = await import("next-auth/react")
    await signOut({ redirect: true, callbackUrl: "/" })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Faculty Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
              {facultyData && (
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{facultyData.department}</Badge>
                  {facultyData.assignedYears?.map((year: string) => (
                    <Badge key={year} variant="secondary">Year {year}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/faculty/notifications")}
              >
                <Bell className="h-4 w-4 mr-2" />
                {stats.unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-1">{stats.unreadNotifications}</Badge>
                )}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Across all assigned years</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayClasses}</div>
              <p className="text-xs text-muted-foreground">
                Attendance: {stats.attendanceMarked}/{stats.todayClasses}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingProjects}</div>
              <p className="text-xs text-muted-foreground">Projects awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignedClasses}</div>
              <p className="text-xs text-muted-foreground">Assigned to teach</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push("/dashboard/faculty/attendance")}
            >
              <UserCheck className="h-6 w-6" />
              <span>Mark Attendance</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push("/dashboard/faculty/assignments")}
            >
              <Upload className="h-6 w-6" />
              <span>Create Assignment</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push("/dashboard/faculty/materials")}
            >
              <FileText className="h-6 w-6" />
              <span>Upload Materials</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push("/dashboard/faculty/grades")}
            >
              <Award className="h-6 w-6" />
              <span>Enter Grades</span>
            </Button>
          </div>
        </div>

        {/* Main Modules */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/profile")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                My Profile
              </CardTitle>
              <CardDescription>
                View and update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage contact details, qualifications, and preferences
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/students")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                My Students
              </CardTitle>
              <CardDescription>
                View students in your assigned years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.totalStudents} students across {facultyData?.assignedYears?.length || 0} years
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/timetable")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                My Timetable
              </CardTitle>
              <CardDescription>
                View your weekly teaching schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Classes, timings, and room assignments
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/attendance")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Attendance
              </CardTitle>
              <CardDescription>
                Mark and manage student attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Today: {stats.attendanceMarked}/{stats.todayClasses} classes marked
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/projects")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Projects
              </CardTitle>
              <CardDescription>
                Supervise and review student projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.pendingProjects} projects pending review
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/grades")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Grades & Marks
              </CardTitle>
              <CardDescription>
                Enter and manage student grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Internal assessments and exam marks
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/assignments")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assignments
              </CardTitle>
              <CardDescription>
                Create and track assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage homework and coursework submissions
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/materials")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Study Materials
              </CardTitle>
              <CardDescription>
                Share notes and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, presentations, and documents
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/performance")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                My Performance
              </CardTitle>
              <CardDescription>
                View your teaching analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Classes, feedback, and student outcomes
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/leave")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Management
              </CardTitle>
              <CardDescription>
                Apply for and track leave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Request time off and view leave balance
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/communication")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication
              </CardTitle>
              <CardDescription>
                Message students and parents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Send announcements and individual messages
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push("/dashboard/faculty/notifications")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {stats.unreadNotifications > 0 && (
                  <Badge variant="destructive">{stats.unreadNotifications}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                View messages from HOD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Announcements and important updates
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
