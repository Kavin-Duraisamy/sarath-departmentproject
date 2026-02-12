"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LogOut, Search, Copy, CheckCircle2 } from "lucide-react"

export default function CredentialsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [studentLogins, setStudentLogins] = useState<any>({})
  const [students, setStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "admin") {
      router.push(`/dashboard/${userData.role}`)
      return
    }

    setUser(userData)

    // Load student logins
    const logins = JSON.parse(localStorage.getItem("studentLogins") || "{}")
    const studentsData = JSON.parse(localStorage.getItem("students") || "[]")

    setStudentLogins(logins)
    setStudents(studentsData)

    // Log to console for debugging
    console.log("[v0] All Student Login Credentials:", logins)
    console.log("[v0] Total students:", Object.keys(logins).length)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredLogins = Object.entries(studentLogins).filter(([rollNo, data]: [string, any]) => {
    const searchLower = searchTerm.toLowerCase()
    return rollNo.toLowerCase().includes(searchLower) || data.name.toLowerCase().includes(searchLower)
  })

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Student Login Credentials</h1>
              <p className="text-sm text-muted-foreground">
                View all student login details ({Object.keys(studentLogins).length} total)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Student Credentials</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {Object.keys(studentLogins).length === 0
                  ? "No students added yet. Add students from HOD/Admin dashboard."
                  : "No students match your search."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogins.map(([rollNo, data]: [string, any]) => (
                  <div
                    key={rollNo}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{data.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Year {data.year} - {data.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Username</p>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{rollNo}</code>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(rollNo, `user-${rollNo}`)}>
                            {copiedId === `user-${rollNo}` ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Password (DOB)</p>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{data.password}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(data.password, `pass-${rollNo}`)}
                          >
                            {copiedId === `pass-${rollNo}` ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Test Student Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Copy the username (roll number) and password (DOB) from above</p>
            <p>2. Log out from admin dashboard</p>
            <p>3. On the login page, paste the username and password</p>
            <p>4. Click Sign In to access the student portal</p>
            <p className="text-muted-foreground mt-4">
              Note: Check browser console (F12) for detailed login debug logs
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
