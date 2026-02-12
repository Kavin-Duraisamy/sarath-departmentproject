"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function FacultyNotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "faculty") {
      router.push(`/dashboard/${userData.role}`)
      return
    }

    setUser(userData)
  }, [router])

  if (!user) {
    return null
  }

  // Mock notifications
  const notifications = [
    {
      id: "1",
      type: "announcement",
      title: "Department Meeting Scheduled",
      message: "Faculty meeting scheduled for next Monday at 10 AM in Conference Room A",
      date: "2024-01-15",
      read: false,
    },
    {
      id: "2",
      type: "project",
      title: "New Project Submission",
      message: "Student John Doe has submitted final year project for review",
      date: "2024-01-14",
      read: false,
    },
    {
      id: "3",
      type: "system",
      title: "Timetable Updated",
      message: "Your teaching schedule has been updated for next semester",
      date: "2024-01-13",
      read: true,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/faculty")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Notifications</h2>
          <p className="text-muted-foreground">View announcements and important updates</p>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Bell className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.date}</p>
                    </div>
                  </div>
                  {!notification.read && <Badge variant="default">New</Badge>}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
