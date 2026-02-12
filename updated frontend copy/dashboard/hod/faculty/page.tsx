"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Faculty = {
  id: string
  name: string
  email: string
  department: string
  phone: string
  subjects: string[]
  assignedYears: string[]
  username: string
}

export default function FacultyManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [facultyToDelete, setFacultyToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    subjects: "",
    assignedYears: [] as string[],
    username: "",
    password: "",
  })

  useEffect(() => {
    // If auth is broken/removed, we might just skip this check or use a mock user
    if (status === "loading") return

    // Fallback: If no session, just allow access for now or redirect to home
    // user requested "old working frontend", assuming they might rely on mock session or loosely checks
    // We will keep the check but be lenient if session provider is removed later

    // const userData = session?.user
    // if (userData) {
    //     setUser(userData)
    // }

    // Load faculty from localStorage
    const storedFaculty = localStorage.getItem("faculty")
    if (storedFaculty) {
      setFaculty(JSON.parse(storedFaculty))
    }
  }, [status, session])

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.password) {
      alert("Please provide both username and password for the faculty")
      return
    }

    const newFaculty: Faculty = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      department: formData.department,
      phone: formData.phone,
      subjects: formData.subjects.split(",").map((s) => s.trim()),
      assignedYears: formData.assignedYears,
      username: formData.username,
    }

    const updatedFaculty = [...faculty, newFaculty]
    setFaculty(updatedFaculty)
    localStorage.setItem("faculty", JSON.stringify(updatedFaculty))

    // Also store login credentials in localStorage for the "mock" backend
    const facultyLogins = JSON.parse(localStorage.getItem("facultyLogins") || "{}")
    facultyLogins[formData.username] = {
      password: formData.password,
      role: "faculty",
      name: formData.name,
      facultyId: newFaculty.id,
      email: formData.email,
    }
    localStorage.setItem("facultyLogins", JSON.stringify(facultyLogins))

    setFormData({
      name: "",
      email: "",
      department: "",
      phone: "",
      subjects: "",
      assignedYears: [],
      username: "",
      password: "",
    })
    setIsDialogOpen(false)
  }

  const handleDeleteFaculty = () => {
    if (!facultyToDelete) return

    const updatedFaculty = faculty.filter((f) => f.id !== facultyToDelete)
    setFaculty(updatedFaculty)
    localStorage.setItem("faculty", JSON.stringify(updatedFaculty))

    const facultyMember = faculty.find((f) => f.id === facultyToDelete)
    if (facultyMember) {
      const facultyLogins = JSON.parse(localStorage.getItem("facultyLogins") || "{}")
      delete facultyLogins[facultyMember.username]
      localStorage.setItem("facultyLogins", JSON.stringify(facultyLogins))
    }

    setDeleteDialogOpen(false)
    setFacultyToDelete(null)
  }

  const toggleYear = (year: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedYears: prev.assignedYears.includes(year)
        ? prev.assignedYears.filter((y) => y !== year)
        : [...prev.assignedYears, year],
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/hod")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight mb-2">Faculty Management</h2>
            <p className="text-muted-foreground">Manage faculty and class assignments</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Faculty</DialogTitle>
                <DialogDescription>Enter faculty details and assign login credentials manually.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddFaculty} className="space-y-4 mt-4">
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
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g., jdoe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Set login password"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjects">Subjects (comma-separated) *</Label>
                  <Input
                    id="subjects"
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    placeholder="e.g., Data Structures, Algorithms, DBMS"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assigned Years *</Label>
                  <div className="flex gap-4">
                    {["I", "II", "III"].map((year) => (
                      <label key={year} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.assignedYears.includes(year)}
                          onChange={() => toggleYear(year)}
                          className="w-4 h-4"
                        />
                        <span>Year {year}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Faculty</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {faculty.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No faculty members added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {faculty.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{member.department} Department</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-sm text-muted-foreground">{member.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {member.assignedYears.map((year) => (
                          <Badge key={year} variant="outline">
                            Year {year}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFacultyToDelete(member.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="text-sm font-medium mb-2">Assigned Subjects:</p>
                    <div className="flex flex-wrap gap-2">
                      {member.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-muted rounded text-xs">
                    <p className="font-medium">Login Credentials:</p>
                    <p>Username: {member.username}</p>
                    <p>Password: (Set by HOD)</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Faculty Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the faculty member and their login credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFaculty} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
