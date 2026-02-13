"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Settings, Database, LogOut, Building2, UserCheck, Briefcase } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { apiClient } from "@/lib/api"

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    departments: 0,
    companies: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role?.toLowerCase() !== "admin") {
      if (userData?.role) router.push(`/dashboard/${userData.role.toLowerCase()}`)
      else router.push("/")
      return
    }

    // Sync accessToken to localStorage for apiClient
    if ((session as any)?.accessToken) {
      localStorage.setItem("accessToken", (session as any).accessToken);
    }

    setUser(userData)
    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await apiClient.getSystemStats()
      setStats(res.data)
    } catch (error) {
      console.error("Failed to fetch system stats", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  if (!user) {
    return null
  }

  const statCards = [
    { title: "Total Students", value: stats.students, icon: Users, color: "text-blue-600" },
    { title: "Total Faculty", value: stats.faculty, icon: UserCheck, color: "text-green-600" },
    { title: "Departments", value: stats.departments, icon: Building2, color: "text-purple-600" },
    { title: "Partner Companies", value: stats.companies, icon: Briefcase, color: "text-orange-600" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
                Refresh Stats
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{loading ? "..." : stat.value}</h3>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-6">Management Modules</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-purple-500"
            onClick={() => router.push("/dashboard/admin/departments")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                <Building2 className="h-5 w-5" />
                Department Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage and track student credentials by department</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-blue-500"
            onClick={() => router.push("/dashboard/admin/users")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                <Users className="h-5 w-5" />
                Staff Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage HODs, Faculty, and Placement Officers</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-slate-400"
            onClick={() => router.push("/dashboard/admin/settings")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-slate-600 transition-colors">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure system preferences and global parameters</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
