"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { findSimilarProjects, detectDomain } from "@/lib/similarity"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HODProjectsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [similarProjects, setSimilarProjects] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData) return

    if (userData.role?.toLowerCase() !== "hod") {
      router.push(`/dashboard/${userData.role?.toLowerCase()}`)
      return
    }

    setUser(userData)
    loadProjects()
  }, [status, session, router])

  const loadProjects = () => {
    const students = JSON.parse(localStorage.getItem("students") || "[]")
    const allProjects: any[] = []

    students.forEach((student: any) => {
      const projectsData = JSON.parse(localStorage.getItem(`student_projects_${student.id}`) || "{}")

      if (projectsData.intern?.title) {
        const domain = detectDomain(projectsData.intern.description || projectsData.intern.title)
        allProjects.push({
          id: `intern-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          type: "Internship",
          title: projectsData.intern.title,
          description: projectsData.intern.description || "",
          technologies: projectsData.intern.technologies || "",
          domain,
          status: projectsData.intern.status || "pending",
        })
      }

      if (projectsData.final?.title) {
        const domain = detectDomain(projectsData.final.description || projectsData.final.title)
        allProjects.push({
          id: `final-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          type: "Final Year",
          title: projectsData.final.title,
          description: projectsData.final.description || "",
          technologies: projectsData.final.technologies || "",
          domain,
          status: projectsData.final.status || "pending",
        })
      }
    })

    setProjects(allProjects)
  }

  const handleViewSimilarity = (project: any) => {
    const otherProjects = projects.filter((p) => p.id !== project.id)
    const similar = findSimilarProjects(
      {
        title: project.title,
        description: project.description,
      },
      otherProjects,
      0.25, // Lower threshold to show more potential matches
    )

    setSelectedProject(project)
    setSimilarProjects(similar)
    setIsDialogOpen(true)
  }

  const handleApprove = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const projectsData = JSON.parse(localStorage.getItem(`student_projects_${project.studentId}`) || "{}")

    if (project.type === "Internship") {
      projectsData.intern.status = "approved"
    } else {
      projectsData.final.status = "approved"
    }

    localStorage.setItem(`student_projects_${project.studentId}`, JSON.stringify(projectsData))
    loadProjects()
  }

  const handleReject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return

    const projectsData = JSON.parse(localStorage.getItem(`student_projects_${project.studentId}`) || "{}")

    if (project.type === "Internship") {
      projectsData.intern.status = "rejected"
    } else {
      projectsData.final.status = "rejected"
    }

    localStorage.setItem(`student_projects_${project.studentId}`, JSON.stringify(projectsData))
    loadProjects()
  }

  if (!user) {
    return null
  }

  const pendingProjects = projects.filter((p) => p.status === "pending")
  const approvedProjects = projects.filter((p) => p.status === "approved")

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
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Project Management</h2>
          <p className="text-muted-foreground">Review projects with AI-based similarity detection</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedProjects.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No projects submitted yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingProjects.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Pending Approval</h3>
                <div className="grid gap-4">
                  {pendingProjects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {project.studentName} ({project.rollNumber})
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{project.type}</Badge>
                            <Badge variant="secondary">{project.domain}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
                        {project.technologies && (
                          <div>
                            <span className="text-sm font-medium">Technologies: </span>
                            <span className="text-sm text-muted-foreground">{project.technologies}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleApprove(project.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(project.id)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleViewSimilarity(project)}>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Check Similarity
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {approvedProjects.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Approved Projects</h3>
                <div className="grid gap-4">
                  {approvedProjects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{project.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {project.studentName} ({project.rollNumber})
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{project.type}</Badge>
                            <Badge variant="secondary">{project.domain}</Badge>
                            <Badge variant="default">Approved</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Similarity Analysis</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Current Project</h4>
                  <p className="text-sm font-medium">{selectedProject.title}</p>
                  <p className="text-sm text-muted-foreground">
                    By {selectedProject.studentName} ({selectedProject.rollNumber})
                  </p>
                </div>

                {similarProjects.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>No similar projects found. This project appears to be unique.</AlertDescription>
                  </Alert>
                ) : (
                  <div>
                    <h4 className="font-semibold mb-3">Similar Projects Detected</h4>
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Found {similarProjects.length} potentially similar project(s). Review for duplication or
                        overlap.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-3">
                      {similarProjects.map(({ project, similarity }) => (
                        <Card key={project.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{project.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {project.studentName} ({project.rollNumber})
                                </p>
                              </div>
                              <Badge
                                variant={similarity > 0.6 ? "destructive" : similarity > 0.4 ? "default" : "secondary"}
                              >
                                {Math.round(similarity * 100)}% Similar
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mt-2">{project.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
