"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { getStudentProfile } from "@/actions/student-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function StudentTimetablePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [studentData, setStudentData] = useState<any>(null)
  const [timetable, setTimetable] = useState<any>({})
  const [settings, setSettings] = useState<any>({
    startTime: "08:30",
    periodDuration: 55,
    periodsPerDay: 5,
    breakAfterPeriod: 2,
    breakDuration: 25
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData) return

    if (userData.role?.toLowerCase() !== "student") {
      router.push(`/dashboard/${userData.role?.toLowerCase()}`)
      return
    }

    setUser(userData)

    const loadData = async () => {
      try {
        const student = await getStudentProfile()
        if (student) {
          setStudentData(student)

          // Load Timetable Data based on year from profile
          const storedTimetable = localStorage.getItem("timetable_data")
          if (storedTimetable) {
            const allData = JSON.parse(storedTimetable)
            // Note: student.currentYear is a number in DB, student.year was a string "I", "II", "III" in mock
            // We might need to map them or handle both.
            // For now, let's try the year directly from profile.
            const yearStr = (student.currentYear === 1 ? "I" : student.currentYear === 2 ? "II" : student.currentYear === 3 ? "III" : student.year) || "I"
            setTimetable(allData[yearStr] || {})
          }
        }
      } catch (e) {
        console.error("Failed to load student profile:", e)
      }

      // Load Settings
      const storedSettings = localStorage.getItem("timetable_settings")
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings))
      }
    }

    loadData()
  }, [status, session, router])

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  // Helper to generate time slots
  const generateTimeSlots = () => {
    const slots: any[] = []
    let currentTime = new Date(`2000-01-01T${settings.startTime}`)
    let periodCount = 0

    while (periodCount < settings.periodsPerDay) {
      periodCount++
      const startStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      currentTime.setMinutes(currentTime.getMinutes() + settings.periodDuration)
      const endStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

      slots.push({
        id: `p-${periodCount}`,
        startTime: startStr,
        endTime: endStr,
        type: "class",
        periodNumber: periodCount
      })

      if (periodCount === settings.breakAfterPeriod) {
        const breakStart = endStr
        currentTime.setMinutes(currentTime.getMinutes() + settings.breakDuration)
        const breakEnd = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        slots.push({ id: `break`, startTime: breakStart, endTime: breakEnd, type: "break" })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()



  if (!user || !studentData) {
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
            <h1 className="text-xl font-semibold">Timetable</h1>
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

        <div
          data-slot="timetable-container"
          className="overflow-x-auto overflow-y-auto max-h-[75vh] border rounded-xl shadow-sm bg-card custom-scrollbar"
        >
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead className="bg-muted text-xs uppercase sticky top-0 z-30">
              <tr>
                <th className="px-6 py-4 font-medium sticky left-0 top-0 bg-secondary z-40 w-40 border-r border-b shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.1)]">
                  Day / Time
                </th>
                {timeSlots.map(slot => (
                  <th key={slot.id} className={`px-6 py-4 font-medium text-center border-l border-b min-w-[200px] ${slot.type === 'break' ? 'bg-orange-100/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <span>{slot.type === 'class' ? `Period ${slot.periodNumber}` : 'BREAK'}</span>
                      <span className="text-[10px] text-muted-foreground font-normal bg-background px-2 py-0.5 rounded-full w-fit mx-auto border">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-left">
              {DAYS.map(day => (
                <tr key={day} className="transition-colors">
                  <td className="px-6 py-4 font-medium sticky left-0 bg-card z-10 border-r border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{day}</td>
                  {timeSlots.map(slot => {
                    if (slot.type === 'break') {
                      return (
                        <td key={slot.id} className="px-6 py-4 bg-orange-50 border-l border-b text-center text-muted-foreground font-medium text-xs tracking-widest">
                          BREAK
                        </td>
                      )
                    }
                    const periodIdx = slot.periodNumber || 0
                    const entry = timetable[day]?.[periodIdx]

                    return (
                      <td key={slot.id} className="px-4 py-3 border-l border-b align-top">
                        {entry && entry.subject ? (
                          <div className="flex flex-col gap-1 p-2 rounded-md border">
                            <div className="font-semibold text-primary">{entry.subject}</div>
                            <div className="text-[10px] text-black flex items-center gap-1">
                              Faculty: {entry.facultyName || "Not assigned"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs flex justify-center mt-2">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
