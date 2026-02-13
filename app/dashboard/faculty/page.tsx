"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Users, Calendar, BookOpen, LogOut, Bell, GraduationCap,
  ClipboardList, FileText, TrendingUp, Award, MessageSquare,
  Upload, Download, Clock, UserCheck, RefreshCw, Layers
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function FacultyDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
    if (!userData || userData.role?.toLowerCase() !== "faculty") {
      if (userData?.role) {
        router.push(`/dashboard/${userData.role.toLowerCase()}`)
      } else {
        router.push("/")
      }
      return
    }

    // Sync accessToken to localStorage for apiClient
    if ((session as any)?.accessToken) {
      localStorage.setItem("accessToken", (session as any).accessToken);
    }

    setUser(userData)
    loadFacultyData()
  }, [session, status, router])

  const loadFacultyData = async () => {
    try {
      setLoading(true)

      const [studentsRes, notificationsRes, projectsRes, timetableRes] = await Promise.all([
        apiClient.getStudents(),
        apiClient.getNotifications(),
        apiClient.getFacultyProjects(),
        apiClient.getTimetableEntries({ facultyId: session?.user?.id })
      ])

      const myStudents = studentsRes.data || []
      const notifications = notificationsRes.data || []
      const unread = notifications.filter((n: any) => !n.isRead).length
      const projects = projectsRes.data || []
      const pendingProjects = projects.filter((p: any) => p.status === 'pending').length
      const classes = timetableRes.data || []

      setStats({
        assignedClasses: user?.subjects?.length || 0,
        totalStudents: myStudents.length,
        pendingProjects: pendingProjects,
        todayClasses: classes.length,
        attendanceMarked: 0, // Mock for now as attendance is separate module
        unreadNotifications: unread,
      })
    } catch (e) {
      console.error("Failed to load faculty stats", e)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { signOut } = await import("next-auth/react")
    await signOut({ redirect: true, callbackUrl: "/" })
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Faculty Dashboard</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Logged in as <span className="text-foreground font-semibold">{user.name}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  <Layers className="h-3 w-3 mr-1" />
                  {user.department}
                </Badge>
                {user.assignedYears?.map((year: string) => (
                  <Badge key={year} variant="secondary" className="font-bold">Year {year}</Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => router.push("/dashboard/faculty/notifications")}
              >
                <Bell className="h-5 w-5" />
                {stats.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {stats.unreadNotifications}
                  </span>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">My Students</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Students in assigned years</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-t-4 border-t-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Today's Slots</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.todayClasses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed: {stats.attendanceMarked}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-t-4 border-t-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Active Projects</CardTitle>
              <ClipboardList className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.pendingProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting your evaluation</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-t-4 border-t-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase text-muted-foreground">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{stats.assignedClasses}</div>
              <p className="text-xs text-muted-foreground mt-1">Academic workload</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all font-bold"
              onClick={() => router.push("/dashboard/faculty/attendance")}
            >
              <UserCheck className="h-6 w-6 text-primary" />
              <span className="text-xs">MARK ATTENDANCE</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-500/5 hover:border-orange-500/50 transition-all font-bold"
              onClick={() => router.push("/dashboard/faculty/assignments")}
            >
              <Upload className="h-6 w-6 text-orange-500" />
              <span className="text-xs">ASSIGNMENTS</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-500/5 hover:border-blue-500/50 transition-all font-bold"
              onClick={() => router.push("/dashboard/faculty/materials")}
            >
              <FileText className="h-6 w-6 text-blue-500" />
              <span className="text-xs">MATERIALS</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/5 hover:border-emerald-500/50 transition-all font-bold"
              onClick={() => router.push("/dashboard/faculty/grades")}
            >
              <Award className="h-6 w-6 text-emerald-500" />
              <span className="text-xs">GRADES</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-500/5 hover:border-purple-500/50 transition-all font-bold"
              onClick={() => router.push("/dashboard/faculty/notifications")}
            >
              <Bell className="h-6 w-6 text-purple-500" />
              <span className="text-xs">ANNOUNCEMENTS</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-slate-500/5 hover:border-slate-500/50 transition-all font-bold"
              onClick={loadFacultyData}
            >
              <RefreshCw className="h-6 w-6 text-slate-500" />
              <span className="text-xs">REFRESH HUB</span>
            </Button>
          </div>
        </div>

        {/* Main Modules */}
        <h2 className="text-lg font-bold mb-4 uppercase tracking-wider text-muted-foreground">Detailed Modules</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-slate-400"
            onClick={() => router.push("/dashboard/faculty/profile")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                <GraduationCap className="h-5 w-5" />
                My Faculty Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage contact details, qualifications, and system preferences
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-400"
            onClick={() => router.push("/dashboard/faculty/students")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                <Users className="h-5 w-5" />
                Student Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View student performance and records for Year {user.assignedYears?.join(', ')}
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-orange-400"
            onClick={() => router.push("/dashboard/faculty/timetable")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-orange-600 transition-colors">
                <Calendar className="h-5 w-5" />
                Teaching Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Weekly timetable, period distributions and classroom slots
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-purple-400"
            onClick={() => router.push("/dashboard/faculty/projects")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                <BookOpen className="h-5 w-5" />
                Project Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor and approve final year and internship projects
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-emerald-400"
            onClick={() => router.push("/dashboard/faculty/performance")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                <TrendingUp className="h-5 w-5" />
                Academic Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review student feedback and previous semester outcomes
              </p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-red-400"
            onClick={() => router.push("/dashboard/faculty/notifications")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-red-600 transition-colors">
                <Bell className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Critical updates and broadcasts from Department HOD
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
