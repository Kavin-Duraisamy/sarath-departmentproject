"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Building2, TrendingUp, LogOut, RefreshCw, Bell, Clock, BarChart3 } from "lucide-react"

import { useSession, signOut } from "next-auth/react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function HODDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCompanies: 0,
    placementRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role?.toLowerCase() !== "hod") {
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
    loadStats()
  }, [session, status, router])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [studentsRes, usersRes, placementStatsRes] = await Promise.all([
        apiClient.getStudents(),
        apiClient.getUsers(),
        apiClient.getPlacementStats()
      ])

      const students = studentsRes.data
      const allUsers = usersRes.data
      const placementStats = placementStatsRes.data

      const facultyUsers = allUsers.filter((u: any) => u.role === 'FACULTY')

      setStats({
        totalStudents: students.length,
        totalFaculty: facultyUsers.length,
        totalCompanies: placementStats.companies || 0,
        placementRate: placementStats.placementRate || 0
      })
    } catch (e) {
      console.error("Failed to load stats", e)
      toast({
        title: "Warning",
        description: "Some dashboard statistics could not be loaded.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
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
              <h1 className="text-2xl font-semibold">HOD Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={loadStats} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all batches</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalFaculty}</div>
              <p className="text-xs text-muted-foreground mt-1">Active staff</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Partner Companies</CardTitle>
              <Building2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground mt-1">Placement drives</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Placement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.placementRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Current academic year</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Management Hub
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-blue-500/50"
            onClick={() => router.push("/dashboard/hod/students")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-blue-600">
                <Users className="h-5 w-5" />
                Manage Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Comprehensive student records, profiles, and academic monitoring</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-green-500/50"
            onClick={() => router.push("/dashboard/hod/batch-progression")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-green-600">
                <RefreshCw className="h-5 w-5" />
                Batch Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage academic year transitions and promote batches</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-emerald-500/50"
            onClick={() => router.push("/dashboard/hod/faculty")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-emerald-600">
                <GraduationCap className="h-5 w-5" />
                Faculty Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View staff details, assign years, and manage credentials</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-cyan-500/50"
            onClick={() => router.push("/dashboard/hod/timetable")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-cyan-600">
                <Clock className="h-5 w-5" />
                Timetable Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Design departmental schedule and periodic slot distribution</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-purple-500/50"
            onClick={() => router.push("/dashboard/placement")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-purple-600">
                <Building2 className="h-5 w-5" />
                Placement Portal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Monitor campus drives, company logs and student applications</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-amber-500/50"
            onClick={() => router.push("/dashboard/hod/projects")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-amber-600">
                <FolderGit2 className="h-5 w-5" />
                Project Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Review and endorse student projects and internships</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-red-500/50"
            onClick={() => router.push("/dashboard/hod/notifications")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-red-600">
                <Bell className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Broadcast critical updates to departmental community</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all group hover:border-slate-500/50"
            onClick={() => router.push("/dashboard/placement/reports")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-slate-600">
                <BarChart3 className="h-5 w-5" />
                Insightful Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Advanced analytics and data visualization for department growth</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

import { FolderGit2 } from "lucide-react"
