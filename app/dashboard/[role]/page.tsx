"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  GraduationCap,
  Users,
  Briefcase,
  FolderKanban,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== params.role) {
      router.push("/")
      return
    }

    setUser(userData)
  }, [params.role, router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleCardClick = (cardTitle: string) => {
    if (cardTitle === "Students" && ["admin", "hod", "faculty"].includes(user.role)) {
      router.push(`/dashboard/${user.role}/students`)
    }
  }

  if (!user) {
    return null
  }

  const dashboardConfig: Record<string, any> = {
    admin: {
      title: "Admin Dashboard",
      description: "System administration and configuration",
      cards: [
        { title: "Users", description: "Manage system users", icon: Users, count: "45" },
        { title: "Settings", description: "System configuration", icon: Settings, count: "12" },
        { title: "Analytics", description: "System reports", icon: BarChart3, count: "8" },
        { title: "Notifications", description: "System alerts", icon: Bell, count: "3" },
      ],
    },
    hod: {
      title: "HOD Dashboard",
      description: "Department management and oversight",
      cards: [
        { title: "Students", description: "Manage student batches", icon: GraduationCap, count: "240" },
        { title: "Faculty", description: "Faculty assignments", icon: Users, count: "18" },
        { title: "Placements", description: "Placement overview", icon: Briefcase, count: "45" },
        { title: "Projects", description: "Project approvals", icon: FolderKanban, count: "32" },
        { title: "Timetable", description: "Schedule management", icon: Calendar, count: "6" },
        { title: "Analytics", description: "Department reports", icon: BarChart3, count: "12" },
      ],
    },
    faculty: {
      title: "Faculty Dashboard",
      description: "Class and student management",
      cards: [
        { title: "My Classes", description: "Assigned classes", icon: GraduationCap, count: "4" },
        { title: "Students", description: "Student management", icon: Users, count: "85" },
        { title: "Projects", description: "Project reviews", icon: FolderKanban, count: "12" },
        { title: "Timetable", description: "Teaching schedule", icon: Calendar, count: "15" },
      ],
    },
    placement: {
      title: "Placement Officer Dashboard",
      description: "Placement drives and company management",
      cards: [
        { title: "Companies", description: "Company profiles", icon: Briefcase, count: "23" },
        { title: "Eligible Students", description: "Filter by criteria", icon: Users, count: "120" },
        { title: "Active Drives", description: "Ongoing placements", icon: Calendar, count: "5" },
        { title: "Analytics", description: "Placement reports", icon: BarChart3, count: "8" },
      ],
    },
    student: {
      title: "Student Dashboard",
      description: "Your academic and placement portal",
      cards: [
        { title: "Profile", description: "Update your details", icon: Users, count: "" },
        { title: "Placements", description: "Available companies", icon: Briefcase, count: "12" },
        { title: "Projects", description: "Your projects", icon: FolderKanban, count: "2" },
        { title: "Timetable", description: "Class schedule", icon: Calendar, count: "" },
        { title: "Notifications", description: "Recent updates", icon: Bell, count: "5" },
      ],
    },
  }

  const config = dashboardConfig[user.role]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Department Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">{config.title}</h2>
          <p className="text-muted-foreground">{config.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {config.cards.map((card: any, index: number) => (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick(card.title)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{card.count}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
