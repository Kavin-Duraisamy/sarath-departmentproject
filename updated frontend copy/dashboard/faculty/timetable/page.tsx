"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getFacultyTimetable } from "@/app/dashboard/faculty/timetable/actions"

type TimeSlot = {
  id: string
  startTime: string
  endTime: string
  type: "class" | "break"
  periodNumber?: number
}

// Replicating types from HOD side for safety
type TimetableEntry = {
  subject: string
  facultyId: string
  facultyName: string
}
type TimetableData = Record<string, Record<string, Record<number, TimetableEntry>>>

type TimetableSettings = {
  startTime: string
  periodDuration: number
  periodsPerDay: number
  breakAfterPeriod: number
  breakDuration: number
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const YEARS = ["I", "II", "III"] as const

export default function FacultyTimetablePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [personalTimetable, setPersonalTimetable] = useState<Record<string, Record<number, { subject: string, year: string }>>>({})
  const [settings, setSettings] = useState<TimetableSettings>({
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
    if (!userData || !userData.name) return

    if (userData.role?.toLowerCase() !== "faculty") {
      router.push(`/dashboard/${userData.role?.toLowerCase()}`)
      return
    }

    setUser(userData);

    // Fetch settings and timetable from server action
    (async () => {
      const { settings: srvSettings, timetable: srvTimetable } = await getFacultyTimetable();
      if (srvSettings) setSettings(srvSettings);
      if (srvTimetable) {
        const mySchedule: Record<string, Record<number, { subject: string; year: string }>> = {};
        const myName = userData.name?.toLowerCase() ?? "";
        DAYS.forEach(day => {
          mySchedule[day] = {};
          for (const yearKey in srvTimetable) {
            const dayData = srvTimetable[yearKey]?.[day];
            if (dayData) {
              Object.entries(dayData).forEach(([periodStr, entry]) => {
                const periodNum = parseInt(periodStr);
                if (entry.facultyName?.toLowerCase() === myName) {
                  mySchedule[day][periodNum] = { subject: entry.subject, year: yearKey };
                }
              });
            }
          }
        });
        setPersonalTimetable(mySchedule);
      }
    })();

  }, [status, session, router])


  // Helper to generate time slots
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    let currentTime = new Date(`2000-01-01T${settings.startTime} `)
    let periodCount = 0
    const maxSlots = 20

    while (periodCount < settings.periodsPerDay && slots.length < maxSlots) {
      periodCount++
      const startStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      currentTime.setMinutes(currentTime.getMinutes() + settings.periodDuration)
      const endStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

      slots.push({
        id: `p - ${periodCount} `,
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



  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/faculty")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">My Teaching Schedule</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Showing schedule for <span className="font-medium text-foreground">{user.name}</span></p>
            <p className="text-xs text-muted-foreground mt-1 text-orange-600 dark:text-orange-400">
              * Showing all assignments including Year I, II, III and other manual classes.
            </p>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{settings.periodsPerDay} Periods / Day</span>
          </div>
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
                  <th key={slot.id} className={`px - 6 py - 4 font - medium text - center border - l border - b min - w - [200px] ${slot.type === 'break' ? 'bg-orange-100/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : ''} `}>
                    <div className="flex flex-col gap-1">
                      <span>{slot.type === 'class' ? `Period ${slot.periodNumber} ` : 'BREAK'}</span>
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
                    const entry = personalTimetable[day]?.[periodIdx]

                    return (
                      <td key={slot.id} className="px-4 py-3 border-l border-b align-top">
                        {entry ? (
                          <div className="flex flex-col gap-2 p-2 rounded-md border">
                            <div className="font-semibold text-primary">{entry.subject}</div>
                            <div className="flex items-center gap-2">
                              {["I", "II", "III"].includes(entry.year) ? (
                                <Badge variant="outline" className="text-[10px] bg-background">Year {entry.year}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] bg-secondary">{entry.year}</Badge>
                              )}
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
