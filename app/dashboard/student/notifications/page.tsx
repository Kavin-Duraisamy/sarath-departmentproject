"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function StudentNotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "student") {
      router.push(`/dashboard/${userData.role}`)
      return
    }

    setUser(userData)
  }, [router])

  // Mock notifications
  const notifications = [
    {
      id: "1",
      type: "placement",
      title: "New Placement Drive",
      message: "Amazon is conducting campus placements. Register by 20th January.",
      date: "2024-01-15",
      read: false,
    },
    {
      id: "2",
      type: "academic",
      title: "Semester Exams Schedule",
      message: "End semester exams will begin from 1st February. Check the detailed schedule.",
      date: "2024-01-14",
      read: false,
    },
    {
      id: "3",
      type: "project",
      title: "Project Submission Reminder",
      message: "Final year project abstract submission deadline is 25th January.",
      date: "2024-01-13",
      read: true,
    },
    {
      id: "4",
      type: "announcement",
      title: "Technical Workshop",
      message: "Workshop on Cloud Computing on 18th January in Seminar Hall.",
      date: "2024-01-12",
      read: true,
    },
  ]

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/student")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Notifications</h2>
          <p className="text-muted-foreground">Stay updated with announcements and important information</p>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Bell className="h-5 w-5 mt-1 text-muted-foreground" />
                    <div className="flex-1">
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
