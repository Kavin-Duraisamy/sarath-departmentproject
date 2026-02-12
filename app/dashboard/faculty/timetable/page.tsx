"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function FacultyTimetablePage() {
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

  // Mock timetable data
  const timetable = [
    {
      day: "Monday",
      periods: ["9:00 AM - Data Structures - II CSE", "11:00 AM - Algorithms - III CSE", "", "2:00 PM - Lab - II CSE"],
    },
    {
      day: "Tuesday",
      periods: ["9:00 AM - Data Structures - II CSE", "", "1:00 PM - Theory of Computation - III CSE", ""],
    },
    {
      day: "Wednesday",
      periods: ["", "11:00 AM - Algorithms - III CSE", "1:00 PM - Data Structures - II CSE", "3:00 PM - Lab - III CSE"],
    },
    {
      day: "Thursday",
      periods: ["9:00 AM - Theory of Computation - III CSE", "", "1:00 PM - Algorithms - III CSE", ""],
    },
    {
      day: "Friday",
      periods: [
        "9:00 AM - Data Structures - II CSE",
        "11:00 AM - Lab - II CSE",
        "",
        "2:00 PM - Theory of Computation - III CSE",
      ],
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
          <h2 className="text-3xl font-semibold tracking-tight mb-2">My Teaching Schedule</h2>
          <p className="text-muted-foreground">View your weekly timetable</p>
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
                    <th className="text-left p-3 bg-muted font-medium">Period 1</th>
                    <th className="text-left p-3 bg-muted font-medium">Period 2</th>
                    <th className="text-left p-3 bg-muted font-medium">Period 3</th>
                    <th className="text-left p-3 bg-muted font-medium">Period 4</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-3 font-medium">{row.day}</td>
                      {row.periods.map((period, periodIdx) => (
                        <td key={periodIdx} className="p-3">
                          {period ? (
                            <Badge variant="outline" className="whitespace-nowrap">
                              {period}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Free</span>
                          )}
                        </td>
                      ))}
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
