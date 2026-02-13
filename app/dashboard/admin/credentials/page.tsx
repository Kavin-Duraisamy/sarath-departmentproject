"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LogOut, Search, Copy, CheckCircle2, ArrowLeft, Shield } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function CredentialsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
    loadCredentials()
  }, [session, status, router, departmentFilter, yearFilter])

  const loadCredentials = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (departmentFilter) params.department = departmentFilter
      if (yearFilter) params.year = yearFilter

      const res = await apiClient.getStudents(params)
      setStudents(res.data)
    } catch (error) {
      console.error("Error loading credentials:", error)
      toast({ title: "Error", description: "Failed to load credentials", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: "Copied!", description: `${text} copied to clipboard` })
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPageTitle = () => {
    if (departmentFilter && yearFilter) {
      return `${departmentFilter} - Year ${yearFilter}`
    } else if (departmentFilter) {
      return `${departmentFilter} - All Years`
    }
    return "Student Credentials"
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
                  Secure access credentials for student portal
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadCredentials} disabled={loading}>
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Credentials List
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">
                No student records found matching your filters.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-all"
                  >
                    <div className="mb-3 sm:mb-0">
                      <h3 className="font-bold text-lg">{student.name}</h3>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1 font-medium">
                        <span>ROLL: <span className="text-foreground">{student.rollNumber}</span></span>
                        <span>YEAR: <span className="text-foreground">{student.year}</span></span>
                        <span>DEPT: <span className="text-foreground">{student.department}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-none">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Username</p>
                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg border">
                          <code className="text-sm font-mono font-bold">{student.rollNumber}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(student.rollNumber, `user-${student.id}`)}
                          >
                            {copiedId === `user-${student.id}` ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Password (DOB)</p>
                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg border">
                          <code className="text-sm font-mono font-bold">{student.dob}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(student.dob, `pass-${student.id}`)}
                          >
                            {copiedId === `pass-${student.id}` ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
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

        <section className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>These credentials grant access to student academic records, internships, and placement applications.</p>
              <p className="font-medium">Standard Default Password Pattern: <span className="font-mono bg-primary/10 px-1 rounded text-primary">YYYY-MM-DD</span></p>
              <p className="text-muted-foreground text-xs italic">Students are encouraged to change their passwords upon first login via the profile settings.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                Testing Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Copy a student's roll number</li>
                <li>Copy their corresponding date of birth</li>
                <li>Log out of the Admin portal</li>
                <li>Authenticate using these credentials on the main login screen</li>
              </ol>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
