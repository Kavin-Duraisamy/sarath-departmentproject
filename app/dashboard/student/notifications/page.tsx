"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function StudentNotificationsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "student") {
      router.push("/")
      return
    }

    setUser(userData)
    fetchNotifications()
  }, [router, session, status])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getNotifications()
      setNotifications(response.data)
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return
    try {
      await apiClient.markNotificationAsRead(id)
      fetchNotifications()
    } catch (error) {
      console.error("Failed to mark as read", error)
    }
  }

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
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No notifications found</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${notification.isRead ? "opacity-60" : "cursor-pointer hover:border-primary/50 transition-colors"}`}
                onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Bell className={`h-5 w-5 mt-1 ${notification.isRead ? "text-muted-foreground" : "text-primary fill-primary/10"}`} />
                      <div className="flex-1">
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.createdAt), "PPP p")}
                        </p>
                      </div>
                    </div>
                    {!notification.isRead && <Badge variant="default">New</Badge>}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
