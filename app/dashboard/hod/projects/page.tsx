"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { apiClient } from "@/lib/api"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Users,
  User as UserIcon,
  ShieldCheck,
  FileText,
  Clock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { findSimilarProjects, detectDomain } from "@/lib/similarity"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function HODProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [myGuidedProjects, setMyGuidedProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [similarProjects, setSimilarProjects] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [facultyFilter, setFacultyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role?.toLowerCase() !== "hod") {
      router.push("/")
      return
    }

    setUser(userData)
    loadData()
  }, [session, status, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allRes, myRes] = await Promise.all([
        apiClient.getAllProjects(),
        apiClient.getFacultyProjects()
      ])

      const formatProject = (p: any) => ({
        ...p,
        studentName: p.student?.name || "Unknown",
        rollNumber: p.student?.rollNumber || "N/A",
        guideName: p.faculty?.name || p.guideName || "Self Guided",
        displayType: p.type === "INTERNSHIP" ? "Internship" : "Final Year Project",
        computedDomain: p.domain || detectDomain(`${p.title} ${p.description || ""}`)
      })

      setAllProjects(allRes.data.map(formatProject))
      setMyGuidedProjects(myRes.data.map(formatProject))
    } catch (error) {
      console.error("Failed to load projects", error)
      toast({
        title: "Error",
        description: "Could not load project data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (project: any) => {
    try {
      await apiClient.updateProjectStatus(project.studentId, project.id, {
        status: "approved",
        remarks: `Approved by HOD (${user.name})`
      })
      toast({ title: "Approved", description: "Project has been approved" })
      loadData()
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve", variant: "destructive" })
    }
  }

  const handleReject = async (project: any) => {
    try {
      await apiClient.updateProjectStatus(project.studentId, project.id, {
        status: "rejected",
        remarks: "Rejected by HOD"
      })
      toast({ title: "Rejected", description: "Project has been rejected" })
      loadData()
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" })
    }
  }

  const handleViewSimilarity = (project: any) => {
    // Check against ALL projects in the department
    const otherProjects = allProjects.filter((p) => p.id !== project.id)
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
    setIsDialogOpen(true)
  }

  const faculties = useMemo(() => {
    const list = new Set(allProjects.map(p => p.guideName))
    return Array.from(list).sort()
  }, [allProjects])

  const filteredProjects = useMemo(() => {
    return allProjects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFaculty = facultyFilter === "all" || p.guideName === facultyFilter
      const matchesStatus = statusFilter === "all" || p.status === statusFilter
      return matchesSearch && matchesFaculty && matchesStatus
    })
  }, [allProjects, searchQuery, facultyFilter, statusFilter])

  if (!user || loading && allProjects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    )
  }

  const ProjectCard = ({ project }: { project: any }) => {
    const [showHistory, setShowHistory] = useState(false);

    return (
      <Card className="group hover:shadow-md transition-all border-none shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{project.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 rounded-md border-primary/20 bg-primary/5 text-primary">
                      {project.displayType}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider h-5 rounded-md">
                      {project.computedDomain}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {project.status === "pending" ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase">
                      <Clock className="w-3 h-3" /> Pending
                    </div>
                  ) : project.status === "approved" ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase">
                      <ShieldCheck className="w-3 h-3" /> Approved
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase">
                      <XCircle className="w-3 h-3" /> Rejected
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2 border-y border-gray-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Student</p>
                  <p className="text-sm font-semibold">{project.studentName}</p>
                  <p className="text-xs text-muted-foreground">{project.rollNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Guide</p>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3 text-blue-500" />
                    <p className="text-sm font-semibold truncate">{project.guideName}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Submitted</p>
                  <p className="text-sm font-semibold">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                {project.status === "approved" && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Approved By</p>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <p className="text-sm font-bold text-green-700">{project.approvedBy || "Administrator"}</p>
                    </div>
                  </div>
                )}
              </div>

              {project.description && (
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  {project.status === "pending" && (
                    <>
                      <Button size="sm" className="rounded-xl h-9 px-4 bg-green-600 hover:bg-green-700 shadow-sm" onClick={() => handleApprove(project)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl h-9 px-4 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleReject(project)}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="secondary" className="rounded-xl h-9 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border-none" onClick={() => handleViewSimilarity(project)}>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Check Similarity
                  </Button>
                  {project.history && project.history.length > 0 && (
                    <Button size="sm" variant="ghost" className="rounded-xl h-9 px-4 text-muted-foreground hover:bg-gray-50" onClick={() => setShowHistory(!showHistory)}>
                      <Clock className="w-4 h-4 mr-2" />
                      {showHistory ? "Hide History" : `View History (${project.history.length})`}
                    </Button>
                  )}
                </div>
              </div>

              {showHistory && project.history && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Approval History
                  </h5>
                  <div className="space-y-4">
                    {project.history.map((h: any, i: number) => (
                      <div key={h.id || i} className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${h.status === 'approved' ? 'bg-green-500' :
                              h.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                          {i !== project.history.length - 1 && <div className="h-full w-px bg-gray-100 mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[10px] font-bold uppercase ${h.status === 'approved' ? 'text-green-600' :
                                h.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                              }`}>{h.status}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(h.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-700 font-medium">{h.remarks}</p>
                          <p className="text-[9px] text-muted-foreground mt-1 tracking-tight">Performed by <span className="font-bold">{h.actionBy}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => router.push("/dashboard/hod")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Project Oversight</h1>
          </div>
          <div className="hidden md:flex items-center bg-primary/5 px-4 py-1.5 rounded-full">
            <Badge variant="outline" className="border-none bg-transparent font-bold text-primary">{user.department}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Projects</p>
              <p className="text-2xl font-black">{allProjects.length}</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black">{allProjects.filter(p => p.status === 'pending').length}</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Approved</p>
              <p className="text-2xl font-black">{allProjects.filter(p => p.status === 'approved').length}</p>
            </div>
          </Card>
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">My Guided</p>
              <p className="text-2xl font-black">{myGuidedProjects.length}</p>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="department" className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-white/50 border h-11 p-1 rounded-xl w-fit">
              <TabsTrigger value="department" className="rounded-lg px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Department Wide</TabsTrigger>
              <TabsTrigger value="my-students" className="rounded-lg px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm">My Students Only</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Search projects, students..."
                  className="pl-10 h-10 rounded-xl border-gray-200 bg-white shadow-sm focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white border-gray-200">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 opacity-50" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="department" className="outline-none">
            <div className="bg-white/50 border-gray-100 border p-4 rounded-3xl mb-6 flex flex-wrap items-center gap-4">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-2">Filter by Guide</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={facultyFilter === "all" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl px-4"
                  onClick={() => setFacultyFilter("all")}
                >
                  All Faculty
                </Button>
                {faculties.map(f => (
                  <Button
                    key={f}
                    variant={facultyFilter === f ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl px-4"
                    onClick={() => setFacultyFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {filteredProjects.length > 0 ? (
                filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-muted-foreground">No projects found for the selected filters</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-students" className="outline-none">
            <div className="grid gap-4">
              {myGuidedProjects.length > 0 ? (
                myGuidedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-muted-foreground">You are not currently guiding any projects</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Similarity Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-gray-900 to-indigo-950 p-8 text-white">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <AlertTriangle className="text-yellow-400 h-7 w-7" />
                AI Similarity Report
              </DialogTitle>
              {selectedProject && (
                <div className="mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Analyzing Project</h4>
                  <p className="text-lg font-bold">{selectedProject.title}</p>
                  <p className="text-sm text-white/70">Submitter: {selectedProject.studentName} • {selectedProject.rollNumber}</p>
                </div>
              )}
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto bg-[#fdfdfd]">
              {similarProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Total Uniqueness Confirmed</h4>
                  <p className="text-gray-500 max-w-sm mt-1">Our AI analyzed all department records and found no significant overlap with this project.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900">Potential Duplicates ({similarProjects.length})</h4>
                    <Badge className="bg-red-50 text-red-600 border-none px-3 py-1 font-bold">Review Required</Badge>
                  </div>

                  <div className="grid gap-4">
                    {similarProjects.map(({ project, similarity }) => (
                      <div key={project.id} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-primary/30 transition-all flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-900">{project.title}</h5>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">GUIDE: {project.guideName || project.faculty?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{project.studentName} ({project.rollNumber})</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 md:w-32">
                          <div className={`text-2xl font-black ${similarity > 0.6 ? 'text-red-600' : similarity > 0.4 ? 'text-orange-600' : 'text-blue-600'}`}>
                            {Math.round(similarity * 100)}%
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Match Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl px-8" onClick={() => setIsDialogOpen(false)}>Close Analysis</Button>
              {selectedProject?.status === 'pending' && (
                <Button variant="destructive" className="rounded-xl px-8 shadow-lg shadow-red-200" onClick={() => { handleReject(selectedProject); setIsDialogOpen(false); }}>Flag & Reject</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
