"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2, Edit, Search, Send, TrendingUp, Upload, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Faculty = {
  id: string
  name: string
  email: string
  department: string
  phone: string
  subjects: string[]
  assignedYears: string[]
  username: string
  classesCount?: number
  feedbackScore?: number
  projectsSupervised?: number
}

type FacultyNotification = {
  id: string
  facultyId: string | 'all'
  message: string
  title: string
  sentBy: string
  sentByName: string
  sentAt: string
  read: boolean
  type: 'individual' | 'broadcast'
}

export default function FacultyManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [hodDepartment, setHodDepartment] = useState<string | null>(null)
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [facultyToDelete, setFacultyToDelete] = useState<string | null>(null)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false)
  const [selectedFacultyForNotification, setSelectedFacultyForNotification] = useState<Faculty | null>(null)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [parsedFaculty, setParsedFaculty] = useState<any[]>([])
  const [bulkUploadErrors, setBulkUploadErrors] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    phone: "",
    subjects: "",
    assignedYears: [] as string[],
    username: "",
    password: "",
    classesCount: 0,
    feedbackScore: 0,
    projectsSupervised: 0,
  })

  const [notificationData, setNotificationData] = useState({
    title: "",
    message: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "hod") {
      if (userData?.role) router.push(`/dashboard/${userData.role}`)
      else router.push("/")
      return
    }

    setUser(userData)
    const department = userData.department || null
    setHodDepartment(department)

    setFormData(prev => ({
      ...prev,
      department: department || ""
    }))

    // Load faculty from localStorage
    const storedFaculty = localStorage.getItem("faculty")
    if (storedFaculty) {
      const parsedFaculty = JSON.parse(storedFaculty)
      const departmentFilteredFaculty = department
        ? parsedFaculty.filter((f: Faculty) => f.department === department)
        : parsedFaculty

      setFaculty(departmentFilteredFaculty)
      setFilteredFaculty(departmentFilteredFaculty)
    }
  }, [session, status, router])

  // Search and filter effect
  useEffect(() => {
    let filtered = faculty

    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((f) => f.assignedYears.includes(yearFilter))
    }

    setFilteredFaculty(filtered)
  }, [searchQuery, yearFilter, faculty])

  const handleAddOrEditFaculty = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please provide both username and password for the faculty",
        variant: "destructive",
      })
      return
    }

    if (isEditMode && editingFacultyId) {
      // Edit existing faculty
      const updatedFaculty = faculty.map(f =>
        f.id === editingFacultyId
          ? {
            ...f,
            name: formData.name,
            email: formData.email,
            department: formData.department,
            phone: formData.phone,
            subjects: formData.subjects.split(",").map((s) => s.trim()),
            assignedYears: formData.assignedYears,
            username: formData.username,
            classesCount: formData.classesCount,
            feedbackScore: formData.feedbackScore,
            projectsSupervised: formData.projectsSupervised,
          }
          : f
      )

      setFaculty(updatedFaculty)
      localStorage.setItem("faculty", JSON.stringify(updatedFaculty))

      // Update staff-users.json via API
      updateStaffUser(editingFacultyId, formData)

      toast({
        title: "Success",
        description: "Faculty updated successfully",
      })
    } else {
      // Add new faculty
      const newFaculty: Faculty = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        department: formData.department,
        phone: formData.phone,
        subjects: formData.subjects.split(",").map((s) => s.trim()),
        assignedYears: formData.assignedYears,
        username: formData.username,
        classesCount: formData.classesCount || 0,
        feedbackScore: formData.feedbackScore || 0,
        projectsSupervised: formData.projectsSupervised || 0,
      }

      const updatedFaculty = [...faculty, newFaculty]
      setFaculty(updatedFaculty)
      localStorage.setItem("faculty", JSON.stringify(updatedFaculty))

      // Add to staff-users.json
      addStaffUser(newFaculty, formData.password)

      toast({
        title: "Success",
        description: "Faculty added successfully",
      })
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const addStaffUser = async (faculty: Faculty, password: string) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: faculty.username,
          password: password,
          name: faculty.name,
          role: "faculty",
          department: faculty.department,
          email: faculty.email,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("Error adding staff user:", error)
        toast({
          title: "Warning",
          description: "Faculty added to system but login may not work. Please contact admin.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding staff user:", error)
      toast({
        title: "Warning",
        description: "Faculty added to system but login may not work. Please contact admin.",
        variant: "destructive",
      })
    }
  }

  const updateStaffUser = async (facultyId: string, formData: any) => {
    try {
      // Note: Would need PUT endpoint for updates
      // For now, just log
      console.log("Update staff user:", facultyId, formData)
    } catch (error) {
      console.error("Error updating staff user:", error)
    }
  }

  const handleEditFaculty = (faculty: Faculty) => {
    setIsEditMode(true)
    setEditingFacultyId(faculty.id)
    setFormData({
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      phone: faculty.phone,
      subjects: faculty.subjects.join(", "),
      assignedYears: faculty.assignedYears,
      username: faculty.username,
      password: "", // Don't show password
      classesCount: faculty.classesCount || 0,
      feedbackScore: faculty.feedbackScore || 0,
      projectsSupervised: faculty.projectsSupervised || 0,
    })
    setIsDialogOpen(true)
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

    toast({
      title: "Faculty Deleted",
      description: "Faculty member has been removed",
    })

    setDeleteDialogOpen(false)
    setFacultyToDelete(null)
  }

  const handleSendNotification = () => {
    if (!selectedFacultyForNotification || !notificationData.title || !notificationData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const notification: FacultyNotification = {
      id: Date.now().toString(),
      facultyId: selectedFacultyForNotification.id,
      title: notificationData.title,
      message: notificationData.message,
      sentBy: user.id,
      sentByName: user.name,
      sentAt: new Date().toISOString(),
      read: false,
      type: 'individual',
    }

    const notifications = JSON.parse(localStorage.getItem("facultyNotifications") || "[]")
    notifications.push(notification)
    localStorage.setItem("facultyNotifications", JSON.stringify(notifications))

    toast({
      title: "Notification Sent",
      description: `Notification sent to ${selectedFacultyForNotification.name}`,
    })

    setNotificationData({ title: "", message: "" })
    setNotificationDialogOpen(false)
    setSelectedFacultyForNotification(null)
  }

  const handleBroadcast = () => {
    if (!notificationData.title || !notificationData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const notification: FacultyNotification = {
      id: Date.now().toString(),
      facultyId: 'all',
      title: notificationData.title,
      message: notificationData.message,
      sentBy: user.id,
      sentByName: user.name,
      sentAt: new Date().toISOString(),
      read: false,
      type: 'broadcast',
    }

    const notifications = JSON.parse(localStorage.getItem("facultyNotifications") || "[]")
    notifications.push(notification)
    localStorage.setItem("facultyNotifications", JSON.stringify(notifications))

    toast({
      title: "Broadcast Sent",
      description: `Announcement sent to all ${faculty.length} faculty members`,
    })

    setNotificationData({ title: "", message: "" })
    setBroadcastDialogOpen(false)
  }

  const handleDownloadTemplate = () => {
    const templateData = hodDepartment ? [
      {
        Name: "John Doe",
        Email: "john@example.com",
        Username: "johndoe",
        Password: "password123",
        Phone: "9876543210",
        Subjects: "Data Structures, Algorithms",
        AssignedYears: "I,II",
      }
    ] : [
      {
        Name: "John Doe",
        Email: "john@example.com",
        Username: "johndoe",
        Password: "password123",
        Phone: "9876543210",
        Department: "Computer Science",
        Subjects: "Data Structures, Algorithms",
        AssignedYears: "I,II",
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Faculty")
    XLSX.writeFile(wb, "Faculty_Upload_Template.xlsx")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        validateBulkData(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse file",
          variant: "destructive",
        })
      }
    }
    reader.readAsBinaryString(file)
  }

  const validateBulkData = (data: any[]) => {
    const errors: any[] = []
    const validFaculty: any[] = []

    const requiredFields = hodDepartment
      ? ["Name", "Email", "Username", "Password", "Phone", "Subjects", "AssignedYears"]
      : ["Name", "Email", "Username", "Password", "Phone", "Department", "Subjects", "AssignedYears"]

    data.forEach((row, index) => {
      const rowNum = index + 2

      const missingFields = requiredFields.filter(field => !row[field])
      if (missingFields.length > 0) {
        errors.push({
          row: rowNum,
          error: `Missing: ${missingFields.join(", ")}`
        })
        return
      }

      if (hodDepartment) {
        row.Department = hodDepartment
      }

      if (faculty.some(f => f.username === row.Username)) {
        errors.push({
          row: rowNum,
          error: `Username ${row.Username} already exists`
        })
        return
      }

      validFaculty.push(row)
    })

    setBulkUploadErrors(errors)
    setParsedFaculty(validFaculty)
  }

  const handleBulkImport = () => {
    const newFaculty: Faculty[] = parsedFaculty.map(row => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: row.Name,
      email: row.Email,
      department: row.Department,
      phone: row.Phone.toString(),
      subjects: row.Subjects.split(",").map((s: string) => s.trim()),
      assignedYears: row.AssignedYears.split(",").map((y: string) => y.trim()),
      username: row.Username,
      classesCount: 0,
      feedbackScore: 0,
      projectsSupervised: 0,
    }))

    const updatedFaculty = [...faculty, ...newFaculty]
    setFaculty(updatedFaculty)
    localStorage.setItem("faculty", JSON.stringify(updatedFaculty))

    // Add to staff users
    newFaculty.forEach((f, index) => {
      addStaffUser(f, parsedFaculty[index].Password)
    })

    toast({
      title: "Success",
      description: `Imported ${newFaculty.length} faculty members`,
    })

    setIsBulkUploadOpen(false)
    setParsedFaculty([])
    setBulkUploadErrors([])
  }

  const toggleYear = (year: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedYears: prev.assignedYears.includes(year)
        ? prev.assignedYears.filter((y) => y !== year)
        : [...prev.assignedYears, year],
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      department: hodDepartment || "",
      phone: "",
      subjects: "",
      assignedYears: [],
      username: "",
      password: "",
      classesCount: 0,
      feedbackScore: 0,
      projectsSupervised: 0,
    })
    setIsEditMode(false)
    setEditingFacultyId(null)
  }

  const getWorkloadBadge = (faculty: Faculty) => {
    const workload = faculty.subjects.length + faculty.assignedYears.length
    if (workload <= 3) return { label: "Light", color: "bg-green-500/10 text-green-700" }
    if (workload <= 6) return { label: "Moderate", color: "bg-blue-500/10 text-blue-700" }
    return { label: "Heavy", color: "bg-orange-500/10 text-orange-700" }
  }

  const getPerformanceBadge = (score: number) => {
    if (score >= 4.5) return { label: "Excellent", color: "bg-green-500/10 text-green-700" }
    if (score >= 3.5) return { label: "Good", color: "bg-blue-500/10 text-blue-700" }
    return { label: "Average", color: "bg-gray-500/10 text-gray-700" }
  }

  if (!user) {
    return null
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
            {hodDepartment && (
              <Badge variant="outline" className="mt-2">
                Department: {hodDepartment}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Broadcast
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Broadcast Announcement</DialogTitle>
                  <DialogDescription>
                    Send announcement to all {faculty.length} faculty members
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={notificationData.title}
                      onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                      placeholder="Announcement title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={notificationData.message}
                      onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                      placeholder="Your message..."
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBroadcastDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleBroadcast}>Send Broadcast</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Faculty</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file to add multiple faculty at once
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    <p className="font-medium mb-2">Instructions:</p>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                      <li>Download the template file first</li>
                      {hodDepartment && (
                        <li className="text-primary font-medium">
                          Department will be auto-assigned as: {hodDepartment}
                        </li>
                      )}
                      <li>Fill in faculty details</li>
                      <li>Username must be unique</li>
                      <li>Subjects should be comma-separated</li>
                      <li>AssignedYears should be comma-separated (I,II,III)</li>
                    </ul>
                    <Button variant="link" onClick={handleDownloadTemplate} className="h-auto p-0 mt-2">
                      <FileDown className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div>
                    <Label>Upload Excel File</Label>
                    <Input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {bulkUploadErrors.length > 0 && (
                    <div className="bg-destructive/10 p-3 rounded text-sm">
                      <p className="font-semibold mb-2">Errors found:</p>
                      <ul className="space-y-1">
                        {bulkUploadErrors.map((err, i) => (
                          <li key={i}>Row {err.row}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedFaculty.length > 0 && (
                    <div className="space-y-2">
                      <div className="bg-green-500/10 p-3 rounded text-sm text-green-700">
                        {parsedFaculty.length} valid faculty ready to import
                      </div>
                      <Button onClick={handleBulkImport} className="w-full">
                        Import {parsedFaculty.length} Faculty
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Faculty
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Faculty" : "Add New Faculty"}</DialogTitle>
                  <DialogDescription>
                    {isEditMode ? "Update faculty details" : "Enter faculty details and assign login credentials"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddOrEditFaculty} className="space-y-4 mt-4">
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
                        placeholder={isEditMode ? "Leave blank to keep current" : "Set login password"}
                        required={!isEditMode}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    {hodDepartment ? (
                      <div className="space-y-2">
                        <Label>Department *</Label>
                        <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted">
                          <Badge variant="secondary">{hodDepartment}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          required
                        />
                      </div>
                    )}
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

                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="classesCount">Classes Conducted</Label>
                      <Input
                        id="classesCount"
                        type="number"
                        value={formData.classesCount}
                        onChange={(e) => setFormData({ ...formData, classesCount: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feedbackScore">Feedback Score (1-5)</Label>
                      <Input
                        id="feedbackScore"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.feedbackScore}
                        onChange={(e) => setFormData({ ...formData, feedbackScore: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectsSupervised">Projects Supervised</Label>
                      <Input
                        id="projectsSupervised"
                        type="number"
                        value={formData.projectsSupervised}
                        onChange={(e) => setFormData({ ...formData, projectsSupervised: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit">{isEditMode ? "Update Faculty" : "Add Faculty"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={yearFilter === "all" ? "default" : "outline"}
                  onClick={() => setYearFilter("all")}
                  size="sm"
                >
                  All
                </Button>
                {["I", "II", "III"].map((year) => (
                  <Button
                    key={year}
                    variant={yearFilter === year ? "default" : "outline"}
                    onClick={() => setYearFilter(year)}
                    size="sm"
                  >
                    Year {year}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredFaculty.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || yearFilter !== "all" ? "No faculty found matching your filters" : "No faculty members added yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredFaculty.map((member) => {
              const workload = getWorkloadBadge(member)
              const performance = getPerformanceBadge(member.feedbackScore || 0)

              return (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{member.name}</CardTitle>
                          <Badge className={workload.color}>{workload.label}</Badge>
                          {member.feedbackScore && member.feedbackScore > 0 && (
                            <Badge className={performance.color}>{performance.label}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.department} Department</p>
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
                            setSelectedFacultyForNotification(member)
                            setNotificationDialogOpen(true)
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/hod/faculty/${member.id}`)}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFaculty(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
                    <div className="space-y-3">
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

                      {(member.classesCount || member.feedbackScore || member.projectsSupervised) && (
                        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                          <div>
                            <p className="text-muted-foreground">Classes</p>
                            <p className="font-semibold">{member.classesCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p className="font-semibold">{member.feedbackScore ? `${member.feedbackScore}/5` : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Projects</p>
                            <p className="font-semibold">{member.projectsSupervised || 0}</p>
                          </div>
                        </div>
                      )}

                      <div className="p-2 bg-muted rounded text-xs">
                        <p className="font-medium">Login Credentials:</p>
                        <p>Username: {member.username}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a message to {selectedFacultyForNotification?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={notificationData.title}
                onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={notificationData.message}
                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                placeholder="Your message..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setNotificationDialogOpen(false)
                setSelectedFacultyForNotification(null)
                setNotificationData({ title: "", message: "" })
              }}>
                Cancel
              </Button>
              <Button onClick={handleSendNotification}>Send</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
