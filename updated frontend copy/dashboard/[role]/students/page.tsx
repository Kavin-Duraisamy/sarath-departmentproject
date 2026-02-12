"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Student = {
  id: string
  name: string
  rollNumber: string
  email: string
  year: "I" | "II" | "III"
  department: string
  dob: string
  phone: string
}

export default function StudentsPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    email: "",
    year: "I" as "I" | "II" | "III",
    department: "",
    dob: "",
    phone: "",
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)

    // Only admin, hod, and faculty can access this page
    if (!["admin", "hod", "faculty"].includes(userData.role)) {
      router.push(`/dashboard/${userData.role}`)
      return
    }

    setUser(userData)

    // Load students from localStorage
    const storedStudents = localStorage.getItem("students")
    if (storedStudents) {
      const parsedStudents = JSON.parse(storedStudents)
      setStudents(parsedStudents)
      setFilteredStudents(parsedStudents)
    }
  }, [params.role, router])

  useEffect(() => {
    let filtered = students

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by year
    if (yearFilter !== "all") {
      filtered = filtered.filter((student) => student.year === yearFilter)
    }

    setFilteredStudents(filtered)
  }, [searchQuery, yearFilter, students])

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault()

    const newStudent: Student = {
      id: Date.now().toString(),
      ...formData,
    }

    const updatedStudents = [...students, newStudent]
    setStudents(updatedStudents)
    localStorage.setItem("students", JSON.stringify(updatedStudents))

    const studentLogins = JSON.parse(localStorage.getItem("studentLogins") || "{}")
    studentLogins[formData.rollNumber] = {
      password: formData.dob,
      role: "student",
      name: formData.name,
      studentId: newStudent.id,
    }
    localStorage.setItem("studentLogins", JSON.stringify(studentLogins))

    // Reset form
    setFormData({
      name: "",
      rollNumber: "",
      email: "",
      year: "I",
      department: "",
      dob: "",
      phone: "",
    })
    setIsDialogOpen(false)
  }

  const getYearBadgeColor = (year: string) => {
    switch (year) {
      case "I":
        return "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
      case "II":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20"
      case "III":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20"
      default:
        return ""
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
            <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/${user.role}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight mb-2">Student Management</h2>
            <p className="text-muted-foreground">Manage students by year (I, II, III)</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter student details to add them to the system. A login will be auto-created with Roll Number as
                  username and DOB as password.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number *</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Select
                      value={formData.year}
                      onValueChange={(value: "I" | "II" | "III") => setFormData({ ...formData, year: value })}
                    >
                      <SelectTrigger id="year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I">First Year (I)</SelectItem>
                        <SelectItem value="II">Second Year (II)</SelectItem>
                        <SelectItem value="III">Third Year (III)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Student</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll number, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="I">First Year (I)</SelectItem>
                  <SelectItem value="II">Second Year (II)</SelectItem>
                  <SelectItem value="III">Third Year (III)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No students found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {students.length === 0
                    ? "Add your first student to get started"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Date of Birth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Badge className={getYearBadgeColor(student.year)}>Year {student.year}</Badge>
                        </TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell className="text-sm">{student.email}</TableCell>
                        <TableCell className="text-sm">{student.phone}</TableCell>
                        <TableCell>{student.dob}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">First Year Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{students.filter((s) => s.year === "I").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Second Year Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{students.filter((s) => s.year === "II").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Third Year Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{students.filter((s) => s.year === "III").length}</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
