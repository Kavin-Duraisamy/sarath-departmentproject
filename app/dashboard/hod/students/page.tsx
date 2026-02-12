"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Plus, Eye, Download, X } from "lucide-react"
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
import { Trash2, Upload, AlertCircle, Check, FileDown, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import { apiClient } from "@/lib/api"


type Student = {
  id: string
  name: string
  rollNumber: string
  email: string
  year: "I" | "II" | "III"
  department: string
  dob: string
  phone: string
  batch: string
}

type BulkUploadError = {
  row: number
  error: string
}

export default function HODStudentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession() // Re-enabled
  const [user, setUser] = useState<any>(null)
  const [hodDepartment, setHodDepartment] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    email: "",
    year: "I" as "I" | "II" | "III",
    department: "",
    dob: "",
    phone: "",
    batch: "",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null)

  // Bulk Upload State
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [bulkUploadErrors, setBulkUploadErrors] = useState<BulkUploadError[]>([])
  const [parsedStudents, setParsedStudents] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Sync token and Fetch students from API
  const fetchStudents = async () => {
    try {
      const response = await apiClient.getStudents({ year: yearFilter === "all" ? undefined : yearFilter })
      setStudents(response.data)
      setFilteredStudents(response.data)
    } catch (error) {
      console.error("Fetch students error:", error)
      toast({
        title: "Error",
        description: "Failed to fetch students from the server.",
        variant: "destructive",
      })
    }
  }

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

    // Sync token for apiClient
    if ((session as any)?.accessToken) {
      localStorage.setItem("accessToken", (session as any).accessToken)
    }

    setUser(userData)
    const department = userData.department || null
    setHodDepartment(department)

    setFormData(prev => ({
      ...prev,
      department: department || ""
    }))

    fetchStudents()
  }, [session, status, router, yearFilter])

  useEffect(() => {
    let filtered = students

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }


    if (yearFilter !== "all") {
      filtered = filtered.filter((student) => student.year === yearFilter)
      // Sort by last 3 digits of roll number
      filtered.sort((a, b) => {
        const rollA = parseInt(a.rollNumber.slice(-3)) || 0
        const rollB = parseInt(b.rollNumber.slice(-3)) || 0
        return rollA - rollB
      })
    }

    setFilteredStudents(filtered)
  }, [searchQuery, yearFilter, students])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await apiClient.createStudent(formData)

      toast({
        title: "Success",
        description: "Student added successfully to database.",
      })

      fetchStudents() // Refresh list
      setFormData({
        name: "",
        rollNumber: "",
        email: "",
        year: "I",
        department: hodDepartment || "",
        dob: "",
        phone: "",
        batch: "",
      })
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Add student error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add student.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMigrateLocalData = async () => {
    const storedStudents = localStorage.getItem("students")
    if (!storedStudents) return

    const localStudents = JSON.parse(storedStudents)
    if (localStudents.length === 0) return

    setIsUploading(true)
    try {
      // Map local storage format back to what bulk API expects if necessary
      const studentsToMigrate = localStudents.map((s: any) => ({
        name: s.name,
        rollNumber: s.rollNumber,
        email: s.email,
        phone: s.phone || "",
        year: s.year,
        department: s.department,
        batch: s.batch,
        dob: s.dob
      }))

      await apiClient.bulkCreateStudents(studentsToMigrate)

      toast({
        title: "Migration Successful",
        description: `Successfully migrated ${studentsToMigrate.length} students to the database.`,
      })

      localStorage.removeItem("students")
      localStorage.removeItem("studentLogins")
      fetchStudents()
    } catch (error: any) {
      console.error("Migration error:", error)
      toast({
        title: "Migration Failed",
        description: error.response?.data?.error || "Failed to migrate existing students.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    // If HOD has assigned department, exclude Department column from template
    const templateData = hodDepartment ? [
      {
        Name: "John Doe",
        RollNumber: "AI2023001",
        Email: "john@example.com",
        Phone: "9876543210",
        Year: "I",
        Batch: "2023-2027",
        DOB: "2005-01-01"
      }
    ] : [
      {
        Name: "John Doe",
        RollNumber: "AI2023001",
        Email: "john@example.com",
        Phone: "9876543210",
        Year: "I",
        Department: "AI & DS",
        Batch: "2023-2027",
        DOB: "2005-01-01"
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Students")
    XLSX.writeFile(wb, "Student_Upload_Template.xlsx")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setBulkUploadErrors([])
    setParsedStudents([])

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
        console.error("Error parsing file:", error)
        toast({
          title: "Error",
          description: "Failed to parse the file. Please ensure it's a valid Excel file.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  const validateBulkData = (data: any[]) => {
    const errors: BulkUploadError[] = []
    const validStudents: any[] = []

    // If HOD has assigned department, Department field is not required in Excel
    // Otherwise, it's required for general HODs
    const requiredFields = hodDepartment
      ? ["Name", "RollNumber", "Email", "Phone", "Year", "Batch", "DOB"]
      : ["Name", "RollNumber", "Email", "Phone", "Year", "Department", "Batch", "DOB"]

    data.forEach((row, index) => {
      const rowNum = index + 2 // +2 because index is 0-based and row 1 is header

      // Check missing fields
      const missingFields = requiredFields.filter(field => !row[field])
      if (missingFields.length > 0) {
        errors.push({
          row: rowNum,
          error: `Missing required fields: ${missingFields.join(", ")}`
        })
        return
      }

      // Auto-assign department for department-specific HODs
      if (hodDepartment) {
        row.Department = hodDepartment
      }

      // Check duplicate in current file (parsed so far)
      if (validStudents.some(s => s.RollNumber === row.RollNumber)) {
        errors.push({
          row: rowNum,
          error: `Duplicate Roll Number in file: ${row.RollNumber}`
        })
        return
      }

      // Check duplicate in existing system
      if (students.some(s => s.rollNumber === row.RollNumber)) {
        errors.push({
          row: rowNum,
          error: `Roll Number already exists in system: ${row.RollNumber}`
        })
        return
      }

      // Validate Email (no spaces)
      if (/\s/.test(row.Email)) {
        errors.push({
          row: rowNum,
          error: `Email must not contain spaces: ${row.Email}`
        })
        return
      }

      // Validate Phone (10 digits)
      if (!/^\d{10}$/.test(row.Phone.toString())) {
        errors.push({
          row: rowNum,
          error: `Phone number must be exactly 10 digits: ${row.Phone}`
        })
        return
      }

      // Validate Year (I, II, III)
      if (!["I", "II", "III"].includes(row.Year)) {
        errors.push({
          row: rowNum,
          error: `Year must be 'I', 'II', or 'III': ${row.Year}`
        })
        return
      }

      // Validate DOB format (YYYY-MM-DD)
      // Basic regex check, mostly relies on string input. 
      // If Excel parses as date object/number, additional handling might be needed but simple string check covers the user requirement for "correct dob format".
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.DOB)) {
        errors.push({
          row: rowNum,
          error: `DOB must be in YYYY-MM-DD format: ${row.DOB}`
        })
        return
      }

      validStudents.push(row)
    })

    setBulkUploadErrors(errors)
    setParsedStudents(validStudents)
  }

  const handleBulkImport = async () => {
    if (parsedStudents.length === 0) return
    setIsUploading(true)

    try {
      const studentsToCreate = parsedStudents.map(row => ({
        name: row.Name,
        rollNumber: row.RollNumber,
        email: row.Email,
        year: row.Year as "I" | "II" | "III",
        department: hodDepartment || row.Department,
        dob: row.DOB,
        phone: row.Phone.toString(),
        batch: row.Batch
      }))

      await apiClient.bulkCreateStudents(studentsToCreate)

      toast({
        title: "Success",
        description: `Successfully imported ${studentsToCreate.length} students to database.`,
      })

      fetchStudents()
      setIsBulkUploadOpen(false)
      setParsedStudents([])
      setBulkUploadErrors([])
    } catch (error: any) {
      console.error("Bulk import error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to import students.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewDetails = (student: Student) => {
    // Redirect to the new detail page [id]
    router.push(`/dashboard/hod/students/${student.id}`)
  }

  const handleDownloadDocument = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return

    try {
      await apiClient.deleteStudent(studentToDelete)

      toast({
        title: "Student Deleted",
        description: "Student record has been permanently removed from database.",
      })

      fetchStudents()
    } catch (error: any) {
      console.error("Delete student error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete student.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    }
  }


  const getYearBadgeColor = (year: string) => {
    switch (year) {
      case "I":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "II":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "III":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
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
            <h2 className="text-3xl font-semibold tracking-tight mb-2">Student Management</h2>
            <p className="text-muted-foreground">View and manage all students</p>
            <div className="flex gap-2 mt-4">
              <Button
                variant={yearFilter === "all" ? "default" : "outline"}
                onClick={() => setYearFilter("all")}
                size="sm"
              >
                All Students
              </Button>
              <Button
                variant={yearFilter === "I" ? "default" : "outline"}
                onClick={() => setYearFilter("I")}
                size="sm"
              >
                I YEAR
              </Button>
              <Button
                variant={yearFilter === "II" ? "default" : "outline"}
                onClick={() => setYearFilter("II")}
                size="sm"
              >
                II YEAR
              </Button>
              <Button
                variant={yearFilter === "III" ? "default" : "outline"}
                onClick={() => setYearFilter("III")}
                size="sm"
              >
                III YEAR
              </Button>
            </div>
            {typeof window !== 'undefined' && localStorage.getItem("students") && JSON.parse(localStorage.getItem("students") || "[]").length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-amber-800 dark:text-amber-400 font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Local Data Found
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-500">
                    You have students saved in your browser's local storage. Migrate them to the database now.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleMigrateLocalData} disabled={isUploading} className="border-amber-400 text-amber-800 hover:bg-amber-100">
                  <Database className="h-4 w-4 mr-2" />
                  Migrate Existing Students
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={(open) => {
              setIsBulkUploadOpen(open)
              if (!open) {
                setBulkUploadErrors([])
                setParsedStudents([])
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Students</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file to add multiple students at once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                    <p className="font-medium">Instructions:</p>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                      <li>Download the template file first</li>
                      <li>Fill in the student details</li>
                      {hodDepartment && (
                        <li className="text-primary font-medium">
                          Department will be auto-assigned as: {hodDepartment}
                        </li>
                      )}
                      <li>Roll Number must be unique</li>
                      <li>Email must not contain spaces</li>
                      <li>Phone must be 10 digits</li>
                      <li>Year must be I, II, or III</li>
                      <li>Dates should be in YYYY-MM-DD format</li>
                    </ul>
                    <Button variant="link" onClick={handleDownloadTemplate} className="h-auto p-0 text-primary">
                      <FileDown className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="file-upload">Upload Excel File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </div>

                  {bulkUploadErrors.length > 0 && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm max-h-40 overflow-y-auto">
                      <p className="font-semibold mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Found {bulkUploadErrors.length} errors:
                      </p>
                      <ul className="space-y-1">
                        {bulkUploadErrors.map((err, i) => (
                          <li key={i}>Row {err.row}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedStudents.length > 0 && (
                    <div className="space-y-2">
                      <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-3 rounded-md text-sm flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        {parsedStudents.length} valid students ready to import
                        {bulkUploadErrors.length > 0 && " (invalid rows will be skipped)"}
                      </div>

                      <div className="border rounded-md max-h-60 overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead>Roll Number</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Department</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedStudents.map((student, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{student.RollNumber}</TableCell>
                                <TableCell>{student.Name}</TableCell>
                                <TableCell>{student.Department}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setIsBulkUploadOpen(false)
                      setBulkUploadErrors([])
                      setParsedStudents([])
                    }} disabled={isUploading}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkImport}
                      disabled={parsedStudents.length === 0 || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Wait, Adding...
                        </>
                      ) : (
                        `Import ${parsedStudents.length > 0 ? `${parsedStudents.length} Valid Students` : "Students"}`
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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

                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="batch">Batch *</Label>
                      <Input
                        id="batch"
                        placeholder="e.g 2023-2027"
                        value={formData.batch}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Department Field - Full Width */}
                  {hodDepartment ? (
                    <div className="space-y-2">
                      <Label>Department *</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted">
                        <Badge variant="secondary" className="text-sm">
                          {hodDepartment}
                        </Badge>
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
                      <TableHead>Year</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
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
                        <TableCell>{student.batch}</TableCell>
                        <TableCell className="text-sm">{student.email}</TableCell>
                        <TableCell className="text-sm">{student.phone}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/hod/students/${student.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStudentToDelete(student.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>


      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student and all their data including
              academic records, profile information, and login credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
