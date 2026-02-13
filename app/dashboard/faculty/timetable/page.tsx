"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"

export default function FacultyTimetablePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [timetableSettings, setTimetableSettings] = useState<any>({
    startTime: "08:30",
    periodDuration: 55,
    periodsPerDay: 5,
    breakAfterPeriod: 2,
    breakDuration: 25,
  })
  const [facultyTimetable, setFacultyTimetable] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "faculty") {
      router.push(userData?.role ? `/dashboard/${userData.role}` : "/")
      return
    }

    setUser(userData)
    fetchData(userData.id)
  }, [session, status, router])

  const fetchData = async (facultyId: string) => {
    try {
      setLoading(true)

      // Fetch Timetable Settings
      const settingsRes = await apiClient.getTimetableSettings()
      if (settingsRes.data && settingsRes.data.startTime) {
        setTimetableSettings(settingsRes.data)
      }

      // Fetch Timetable Entries for this specific faculty
      const entriesRes = await apiClient.getTimetableEntries({ facultyId })
      const dbEntries = entriesRes.data
      setFacultyTimetable(dbEntries || [])
    } catch (error) {
      console.error("Failed to fetch timetable data", error)
    } finally {
      setLoading(false)
    }
  }

  // Helper to generate time slots (to show when the classes are)
  const getSlotTime = (periodIdx: number) => {
    let currentTime = new Date(`2000-01-01T${timetableSettings.startTime}`)

    // Skip to the correct period
    for (let i = 0; i < periodIdx; i++) {
      currentTime.setMinutes(currentTime.getMinutes() + (timetableSettings.periodDuration || 55))
      if (i + 1 === timetableSettings.breakAfterPeriod) {
        currentTime.setMinutes(currentTime.getMinutes() + (timetableSettings.breakDuration || 25))
      }
    }

    const startStr = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    currentTime.setMinutes(currentTime.getMinutes() + (timetableSettings.periodDuration || 55))
    const endStr = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

    return `${startStr} - ${endStr}`
  }

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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
          <h2 className="text-3xl font-semibold tracking-tight mb-2">My Teaching Schedule</h2>
          <p className="text-muted-foreground">Classes assigned to you in the {user.department} department</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 bg-muted font-medium">Day</th>
                    <th className="text-left p-3 bg-muted font-medium">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const dayEntries = facultyTimetable.filter(e => e.day === day)
                    return (
                      <tr key={day} className="border-b hover:bg-muted/5 transition-colors">
                        <td className="p-3 font-medium w-32">{day}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {dayEntries.length > 0 ? (
                              dayEntries.sort((a, b) => a.periodIndex - b.periodIndex).map((entry, idx) => (
                                <div key={idx} className="flex flex-col border rounded p-2 bg-card min-w-[200px]">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="secondary" className="text-[10px]">
                                      Period {entry.periodIndex + 1}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {getSlotTime(entry.periodIndex)}
                                    </span>
                                  </div>
                                  <div className="font-semibold text-sm">{entry.subject}</div>
                                  <div className="text-xs text-muted-foreground">Year {entry.year}</div>
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm italic">No classes assigned</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
