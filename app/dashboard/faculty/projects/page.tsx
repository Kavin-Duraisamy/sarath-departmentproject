"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { findSimilarProjects, detectDomain } from "@/lib/similarity"
import { apiClient } from "@/lib/api"
import { format } from "date-fns"

export default function FacultyProjectsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Similarity Dialog
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [similarProjects, setSimilarProjects] = useState<any[]>([])
  const [isSimilarityDialogOpen, setIsSimilarityDialogOpen] = useState(false)

  // Action Dialog (Approve/Reject)
  const [actionProject, setActionProject] = useState<any>(null)
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(null)
  const [remarks, setRemarks] = useState("")
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiClient.getCurrentUser();
        const userData = res.data;

        if (userData.role !== "FACULTY" && userData.role !== "HOD") {
          // Redirect if not faculty/hod (though middleware should handle this)
          router.push(`/dashboard/${userData.role.toLowerCase()}`)
          return;
        }

        setUser(userData);

        const projectsRes = await apiClient.getFacultyProjects();
        if (projectsRes.data) {
          // Enhance projects with domain detection
          const enhancedProjects = projectsRes.data.map((p: any) => ({
            ...p,
            domain: detectDomain(p.description || p.title),
            studentName: p.student?.name,
            rollNumber: p.student?.rollNumber
          }));
          setProjects(enhancedProjects);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [router])

  const openActionDialog = (project: any, type: "approved" | "rejected") => {
    setActionProject(project)
    setActionType(type)
    setRemarks("")
    setIsActionDialogOpen(true)
  }

  const handleActionSubmit = async () => {
    if (!actionProject || !actionType) return;

    try {
      await apiClient.updateProjectStatus(actionProject.studentId, actionProject.id, {
        status: actionType,
        remarks: remarks
      });

      // Update local state
      setProjects(prev => prev.map(p =>
        p.id === actionProject.id
          ? { ...p, status: actionType, remarks: remarks, approvedAt: actionType === 'approved' ? new Date().toISOString() : null }
          : p
      ));

      setIsActionDialogOpen(false);
    } catch (error) {
      console.error("Failed to update project status", error);
      alert("Failed to update project status");
    }
  }

  const handleViewSimilarity = (project: any) => {
    const otherProjects = projects.filter((p) => p.id !== project.id)
    const similar = findSimilarProjects(
      {
        title: project.title,
        description: project.description,
      },
      otherProjects,
      0.25,
    )

    setSelectedProject(project)
    setSimilarProjects(similar)
    setIsSimilarityDialogOpen(true)
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
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
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Project Reviews</h2>
          <p className="text-muted-foreground">Review student projects assigned to you with AI similarity detection</p>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No projects assigned to you yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.studentName} ({project.rollNumber})
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{project.type}</Badge>
                      <Badge variant="secondary">{project.domain}</Badge>
                      {project.status === "approved" && <Badge variant="default">Approved</Badge>}
                      {project.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {project.technologies && (
                      <div>
                        <span className="font-medium">Technologies: </span>
                        <span>{project.technologies}</span>
                      </div>
                    )}
                    {project.duration && (
                      <div>
                        <span className="font-medium">Duration: </span>
                        <span>{project.duration}</span>
                      </div>
                    )}
                  </div>

                  {project.remarks && (
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <span className="font-semibold block mb-1">Remarks:</span>
                      {project.remarks}
                      {project.approvedAt && project.status === 'approved' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Approved on: {format(new Date(project.approvedAt), "PPP p")}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {project.status === "pending" ? (
                      <>
                        <Button size="sm" variant="default" onClick={() => openActionDialog(project, "approved")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openActionDialog(project, "rejected")}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => openActionDialog(project, project.status === 'approved' ? 'rejected' : 'approved')}>
                        Change Status
                      </Button>
                    )}

                    <Button size="sm" variant="secondary" onClick={() => handleViewSimilarity(project)}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Check Similarity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionType === 'approved' ? 'Approve Project' : 'Reject Project'}</DialogTitle>
              <DialogDescription>
                Add remarks for the student regarding this decision.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Enter your remarks here..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
              <Button variant={actionType === 'approved' ? 'default' : 'destructive'} onClick={handleActionSubmit}>
                Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Similarity Dialog */}
        <Dialog open={isSimilarityDialogOpen} onOpenChange={setIsSimilarityDialogOpen}>
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
                  <p className="text-sm text-muted-foreground">No similar projects found. This project is unique.</p>
                ) : (
                  <div>
                    <h4 className="font-semibold mb-3">Similar Projects Detected ({similarProjects.length})</h4>
                    <div className="space-y-3">
                      {similarProjects.map(({ project, similarity }) => (
                        <Card key={project.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
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
