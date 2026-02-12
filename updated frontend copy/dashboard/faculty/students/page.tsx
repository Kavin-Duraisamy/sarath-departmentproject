"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Eye, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

export default function FacultyStudentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData) return

    if (userData.role?.toLowerCase() !== "faculty") {
      router.push(`/dashboard/${userData.role?.toLowerCase()}`)
      return
    }

    setUser(userData)

    const storedStudents = localStorage.getItem("students")
    if (storedStudents) {
      const parsedStudents = JSON.parse(storedStudents)

      // Filter students by faculty's assigned years
      const assignedYears = userData.assignedYears || []
      const filteredByYear =
        assignedYears.length > 0
          ? parsedStudents.filter((s: Student) => assignedYears.includes(s.year))
          : parsedStudents

      console.log("[v0] Faculty assigned years:", assignedYears)
      console.log("[v0] Filtered students:", filteredByYear)

      setStudents(filteredByYear)
      setFilteredStudents(filteredByYear)
    }
  }, [router])

  useEffect(() => {
    let filtered = students

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (yearFilter !== "all") {
      filtered = filtered.filter((student) => student.year === yearFilter)
    }

    setFilteredStudents(filtered)
  }, [searchQuery, yearFilter, students])

  const handleViewDetails = (student: Student) => {
    const profileData = JSON.parse(localStorage.getItem(`student_profile_${student.id}`) || "{}")
    const academicsData = JSON.parse(localStorage.getItem(`student_academics_${student.id}`) || "{}")
    const internshipsData = JSON.parse(localStorage.getItem(`student_internships_${student.id}`) || "[]")
    const resumesData = JSON.parse(localStorage.getItem(`student_resumes_${student.id}`) || "[]")
    const projectsData = JSON.parse(localStorage.getItem(`student_projects_${student.id}`) || "{}")
    const certificatesData = JSON.parse(localStorage.getItem(`student_certificates_${student.id}`) || "[]")

    setSelectedStudent({
      ...student,
      profile: profileData,
      academics: academicsData,
      internships: internshipsData,
      resumes: resumesData,
      projects: projectsData,
      certificates: certificatesData,
    })
    setIsDialogOpen(true)
  }

  const handleDownloadDocument = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
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
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/faculty")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Student Management</h2>
          <p className="text-muted-foreground">View and manage student information</p>
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
                        <TableCell className="text-sm">{student.email}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(student)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Student Profile</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6 mt-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span> {selectedStudent.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Roll Number:</span> {selectedStudent.rollNumber}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span> {selectedStudent.email}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span> {selectedStudent.phone}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Year:</span> {selectedStudent.year}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Department:</span> {selectedStudent.department}
                      </div>
                      {selectedStudent.profile.skills && (
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-muted-foreground">Skills:</span> {selectedStudent.profile.skills}
                        </div>
                      )}
                      {selectedStudent.profile.communicationCategory && (
                        <div>
                          <span className="text-muted-foreground">Communication:</span>{" "}
                          <Badge variant="outline">{selectedStudent.profile.communicationCategory}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Academic Performance */}
                {selectedStudent.academics.cgpa && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Academic Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <span className="text-muted-foreground">Overall CGPA:</span>{" "}
                        <span className="text-3xl font-bold ml-2">{selectedStudent.academics.cgpa}</span>
                      </div>
                      {selectedStudent.academics.semesters && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {Object.entries(selectedStudent.academics.semesters).map(([sem, data]: [string, any]) => (
                            <div key={sem} className="p-3 border rounded-md">
                              <p className="font-medium">{sem}</p>
                              <p className="text-muted-foreground">SGPA: {data.sgpa || "N/A"}</p>
                              <p className="text-muted-foreground">Arrears: {data.arrears || 0}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Internships with download */}
                {selectedStudent.internships.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Internships & Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedStudent.internships.map((intern: any) => (
                          <div key={intern.id} className="p-3 border rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{intern.company}</p>
                                <p className="text-sm text-muted-foreground">{intern.role}</p>
                                <p className="text-xs text-muted-foreground mt-1">{intern.duration}</p>
                              </div>
                              {intern.certificateUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownloadDocument(intern.certificateUrl, `${intern.company}_certificate.pdf`)
                                  }
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resumes with download */}
                {selectedStudent.resumes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedStudent.resumes.map((resume: any) => (
                          <div key={resume.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="font-medium">{resume.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(resume.uploadedAt).toLocaleDateString()}
                                {resume.isActive && <Badge className="ml-2 bg-green-500">Active</Badge>}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDocument(resume.fileUrl, `${resume.name}.pdf`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certificates with download */}
                {selectedStudent.certificates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Certificates & Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {selectedStudent.certificates.map((cert: any) => (
                          <div key={cert.id} className="p-3 border rounded-md">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{cert.name}</p>
                                <p className="text-xs text-muted-foreground">{cert.issuedBy}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(cert.issueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {cert.category}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full bg-transparent"
                              onClick={() => handleDownloadDocument(cert.fileUrl, `${cert.name}.pdf`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Projects */}
                {(selectedStudent.projects.intern || selectedStudent.projects.final) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedStudent.projects.intern?.title && (
                          <div>
                            <p className="font-medium mb-1">Internship Project</p>
                            <div className="p-3 border rounded-md">
                              <p className="text-sm font-medium">{selectedStudent.projects.intern.title}</p>
                              {selectedStudent.projects.intern.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {selectedStudent.projects.intern.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedStudent.projects.final?.title && (
                          <div>
                            <p className="font-medium mb-1">Final Year Project</p>
                            <div className="p-3 border rounded-md">
                              <p className="text-sm font-medium">{selectedStudent.projects.final.title}</p>
                              {selectedStudent.projects.final.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {selectedStudent.projects.final.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
