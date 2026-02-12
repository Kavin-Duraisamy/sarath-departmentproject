"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LogOut, Search, Copy, CheckCircle2, ArrowLeft } from "lucide-react"

import { useSession, signOut } from "next-auth/react"

export default function CredentialsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [studentLogins, setStudentLogins] = useState<any>({})
  const [students, setStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Get filter parameters from URL
  const departmentFilter = searchParams.get("department")
  const yearFilter = searchParams.get("year")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "admin") {
      if (userData?.role) router.push(`/dashboard/${userData.role}`)
      else router.push("/")
      return
    }

    setUser(userData)

    // Load student logins and students data
    const logins = JSON.parse(localStorage.getItem("studentLogins") || "{}")
    const studentsData = JSON.parse(localStorage.getItem("students") || "[]")

    setStudentLogins(logins)
    setStudents(studentsData)
  }, [session, status, router])

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter logins based on department and year
  const filteredLogins = Object.entries(studentLogins).filter(([rollNo, data]: [string, any]) => {
    // Find the corresponding student record to get year and department
    const student = students.find(s => s.rollNumber === rollNo)

    if (!student) return false

    // Apply department filter
    if (departmentFilter && student.department !== departmentFilter) {
      return false
    }

    // Apply year filter
    if (yearFilter && student.year !== yearFilter) {
      return false
    }

    // Apply search term
    const searchLower = searchTerm.toLowerCase()
    if (searchTerm && !(
      rollNo.toLowerCase().includes(searchLower) ||
      data.name.toLowerCase().includes(searchLower)
    )) {
      return false
    }

    return true
  })

  const getPageTitle = () => {
    if (departmentFilter && yearFilter) {
      return `${departmentFilter} - Year ${yearFilter} Credentials`
    } else if (departmentFilter) {
      return `${departmentFilter} - All Years`
    }
    return "All Student Credentials"
  }

  const getBackLink = () => {
    if (departmentFilter) {
      return `/dashboard/admin/departments/${encodeURIComponent(departmentFilter)}`
    }
    return "/dashboard/admin/departments"
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push(getBackLink())}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">{getPageTitle()}</h1>
                <p className="text-sm text-muted-foreground">
                  Student login credentials ({filteredLogins.length} students)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
                Dashboard
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
              <CardTitle>Student Credentials</CardTitle>
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
                  ? "No students added yet. Add students from HOD dashboard."
                  : "No students match your filters."}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogins.map(([rollNo, data]: [string, any]) => {
                  // Find student to get year and department
                  const student = students.find(s => s.rollNumber === rollNo)

                  return (
                    <div
                      key={rollNo}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{data.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Year {student?.year || 'N/A'} - {student?.department || 'N/A'}
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
                  )
                })}
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
