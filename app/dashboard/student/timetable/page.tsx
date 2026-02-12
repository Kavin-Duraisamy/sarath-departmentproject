"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function StudentTimetablePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [studentData, setStudentData] = useState<any>(null)
  const [timetableSettings, setTimetableSettings] = useState<any>({
    startTime: "08:30",
    periodDuration: 55,
    periodsPerDay: 5,
    breakAfterPeriod: 2,
    breakDuration: 25,
  })
  const [timetableData, setTimetableData] = useState<any>({})

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "student") {
      if (userData?.role) {
        router.push(`/dashboard/${userData.role}`)
      } else {
        router.push("/")
      }
      return
    }

    setUser(userData)

    const students = JSON.parse(localStorage.getItem("students") || "[]")
    // In NextAuth, we mapped student roll number or ID to session.user.id
    const student = students.find((s: any) => s.id === userData.id || s.rollNumber === userData.id)
    if (student) {
      setStudentData(student)
    }

    // Load Timetable Settings and Data
    const storedSettings = localStorage.getItem("timetable_settings")
    if (storedSettings) {
      setTimetableSettings(JSON.parse(storedSettings))
    }

    const storedData = localStorage.getItem("timetable_data")
    if (storedData) {
      setTimetableData(JSON.parse(storedData))
    }
  }, [session, status, router])

  if (!user || !studentData) {
    return null
  }

  // Helper to generate time slots based on settings (matched with HOD logic)
  const generateTimeSlots = () => {
    const slots: any[] = []
    let currentTime = new Date(`2000-01-01T${timetableSettings.startTime}`)
    let periodCount = 0
    const maxSlots = 20

    while (periodCount < timetableSettings.periodsPerDay && slots.length < maxSlots) {
      periodCount++
      const startStr = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      currentTime.setMinutes(currentTime.getMinutes() + timetableSettings.periodDuration)
      const endStr = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

      slots.push({
        id: `p-${periodCount}`,
        startTime: startStr,
        endTime: endStr,
        type: "class",
        periodNumber: periodCount,
      })

      if (periodCount === timetableSettings.breakAfterPeriod) {
        const breakStart = endStr
        currentTime.setMinutes(currentTime.getMinutes() + timetableSettings.breakDuration)
        const breakEnd = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

        slots.push({
          id: `break`,
          startTime: breakStart,
          endTime: breakEnd,
          type: "break",
        })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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
          <h2 className="text-3xl font-semibold tracking-tight mb-2">My Timetable</h2>
          <p className="text-muted-foreground">
            Year {studentData.year} - {studentData.department}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 bg-muted font-medium">Day / Time</th>
                    {timeSlots.map((slot) => (
                      <th key={slot.id} className="text-center p-3 bg-muted font-medium min-w-[150px]">
                        <div className="flex flex-col gap-1">
                          <span>{slot.type === "class" ? `Period ${slot.periodNumber}` : "BREAK"}</span>
                          <span className="text-[10px] font-normal text-muted-foreground whitespace-nowrap">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day} className="border-b">
                      <td className="p-3 font-medium bg-muted/30">{day}</td>
                      {timeSlots.map((slot) => {
                        if (slot.type === "break") {
                          return (
                            <td key={slot.id} className="p-3 bg-orange-50/50 text-center relative">
                              <span className="text-[10px] font-bold text-orange-300 tracking-widest">BREAK</span>
                            </td>
                          )
                        }

                        const periodIdx = slot.periodNumber
                        const entry = timetableData[studentData.year]?.[day]?.[periodIdx]

                        return (
                          <td key={slot.id} className="p-3 text-center">
                            {entry?.subject ? (
                              <div className="space-y-1">
                                <Badge variant="default" className="whitespace-normal h-auto py-1 px-2">
                                  {entry.subject}
                                </Badge>
                                {entry.facultyName && (
                                  <p className="text-[10px] text-muted-foreground italic line-clamp-1">
                                    {entry.facultyName}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/40 font-light italic">No Class</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
