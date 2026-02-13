"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, TrendingUp, LogOut, Briefcase } from "lucide-react"

export default function PlacementDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalApplications: 0,
    placedStudents: 0,
    activeJobs: 0,
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role?.toLowerCase() !== "placement") {
      router.push("/")
      return
    }

    // Sync accessToken to localStorage for apiClient
    if ((session as any)?.accessToken) {
      localStorage.setItem("accessToken", (session as any).accessToken);
    }

    setUser(userData)
    fetchDashboardStats()
  }, [router, session, status])

  const fetchDashboardStats = async () => {
    try {
      const companiesResponse = await apiClient.getCompanies()
      const applicationsResponse = await apiClient.getApplications()

      const companies = companiesResponse.data
      const applications = applicationsResponse.data
      const placedStudents = applications.filter((app: any) => app.status === "SELECTED")

      setStats({
        totalCompanies: companies.length,
        totalApplications: applications.length,
        placedStudents: placedStudents.length,
        activeJobs: companies.length, // Until I add status field to schema
      })
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error)
    }
  }

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
            <div>
              <h1 className="text-2xl font-semibold">Placement Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered companies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">Open positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">Total applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Placed Students</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.placedStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully placed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/placement/companies")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Manage Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add companies, create job postings, and manage eligibility
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/placement/applications")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View applications and mark students as placed</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/placement/reports")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Placement Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View placement statistics and company-wise reports</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/placement/students")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Eligible Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Filter students by communication category and eligibility</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
