"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search } from "lucide-react"

export default function EligibleStudentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [commFilter, setCommFilter] = useState<string>("all")
  const [placementFilter, setPlacementFilter] = useState<string>("all")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "placement") {
      router.push(`/dashboard/${userData.role}`)
      return
    }

    setUser(userData)

    // Load final year students with their profiles
    const allStudents = JSON.parse(localStorage.getItem("students") || "[]")
    const finalYearStudents = allStudents
      .filter((s: any) => s.year === "III")
      .map((s: any) => {
        const profile = JSON.parse(localStorage.getItem(`student_profile_${s.id}`) || "{}")
        const academics = JSON.parse(localStorage.getItem(`student_academics_${s.id}`) || "{}")
        const applications = JSON.parse(localStorage.getItem("applications") || "[]")
        const studentApplications = applications.filter((app: any) => app.studentId === s.id)

        return {
          ...s,
          communicationCategory: profile.communicationCategory || "Not Set",
          cgpa: academics.cgpa || "N/A",
          placementStatus:
            studentApplications.filter((app: any) => app.status === "placed").length > 0 ? "placed" : "unplaced",
          offerCount: studentApplications.filter((app: any) => app.status === "placed").length,
        }
      })

    setStudents(finalYearStudents)
    setFilteredStudents(finalYearStudents)
  }, [router])

  useEffect(() => {
    let filtered = students

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (commFilter !== "all") {
      filtered = filtered.filter((student) => student.communicationCategory === commFilter)
    }

    if (placementFilter !== "all") {
      filtered = filtered.filter((student) => student.placementStatus === placementFilter)
    }

    setFilteredStudents(filtered)
  }, [searchQuery, commFilter, placementFilter, students])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/placement")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Eligible Students</h2>
          <p className="text-muted-foreground">Filter students by communication category and placement status</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={commFilter} onValueChange={setCommFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Communication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="below-average">Below Average</SelectItem>
                </SelectContent>
              </Select>
              <Select value={placementFilter} onValueChange={setPlacementFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="placed">Placed</SelectItem>
                  <SelectItem value="unplaced">Unplaced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>CGPA</TableHead>
                      <TableHead>Communication</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Offers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.cgpa}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {student.communicationCategory.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.placementStatus === "placed" ? "default" : "secondary"}>
                            {student.placementStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.offerCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-medium">Total Final Year Students</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{students.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-medium">Placed Students</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {students.filter((s) => s.placementStatus === "placed").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-medium">Unplaced Students</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {students.filter((s) => s.placementStatus === "unplaced").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <p className="text-sm font-medium">Placement %</p>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {students.length > 0
                  ? Math.round((students.filter((s) => s.placementStatus === "placed").length / students.length) * 100)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
