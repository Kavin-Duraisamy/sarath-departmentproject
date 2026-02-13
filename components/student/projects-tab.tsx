"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api, { apiClient } from "@/lib/api"
import { format } from "date-fns"

type ProjectsProps = {
  studentId: string
  studentYear: string
}

export function ProjectsTab({ studentId, studentYear }: ProjectsProps) {
  const [isEditingIntern, setIsEditingIntern] = useState(false)
  const [isEditingFinal, setIsEditingFinal] = useState(false)
  const [facultyList, setFacultyList] = useState<any[]>([])

  const [internProject, setInternProject] = useState({
    id: "",
    title: "",
    description: "",
    technologies: "",
    duration: "",
    guide: "",
    guideEmail: "",
    status: "pending",
    remarks: "",
    approvedAt: null as string | null,
    history: [] as any[]
  })
  const [finalProject, setFinalProject] = useState({
    id: "",
    title: "",
    description: "",
    technologies: "",
    guide: "",
    guideEmail: "",
    status: "pending",
    remarks: "",
    approvedAt: null as string | null,
    history: [] as any[]
  })

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const res = await apiClient.getStudent(studentId);
      if (res.data && res.data.projects) {
        const intern = res.data.projects.find((p: any) => p.type === 'INTERNSHIP');
        const final = res.data.projects.find((p: any) => p.type === 'FINAL_YEAR');

        if (intern) {
          setInternProject({
            id: intern.id,
            title: intern.title,
            description: intern.description || "",
            technologies: intern.technologies || intern.techStack || "", // fallback
            duration: intern.duration || "",
            guide: intern.guideName || "",
            guideEmail: intern.guideEmail || "",
            status: intern.status || "pending",
            remarks: intern.remarks || "",
            approvedAt: intern.approvedAt || null,
            history: intern.history || []
          });
        }
        if (final) {
          setFinalProject({
            id: final.id,
            title: final.title,
            description: final.description || "",
            technologies: final.technologies || final.techStack || "",
            guide: final.guideName || "",
            guideEmail: final.guideEmail || "",
            status: final.status || "pending",
            remarks: final.remarks || "",
            approvedAt: final.approvedAt || null,
            history: final.history || []
          });
        }
      }
    } catch (error) {
      console.error("Fetch projects error", error);
    }
  }

  useEffect(() => {
    const loadFaculty = async () => {
      try {
        // Fetch faculty from API (now allows students to see faculty in their department)
        const res = await apiClient.getUsers();
        if (res.data) {
          const facultyOptions = res.data.map((u: any) => ({
            name: u.name,
            email: u.email || u.username,
            role: u.role === 'HOD' ? 'HOD' : 'Faculty'
          }));
          setFacultyList(facultyOptions);
        }
      } catch (error) {
        console.error("Failed to load faculty list", error);
        // Fallback to localStorage if API fails (legacy support)
        const faculty = JSON.parse(localStorage.getItem("faculty") || "[]");
        const staffLogins = JSON.parse(localStorage.getItem("staffLogins") || "[]");
        const hodUser = staffLogins.find((u: any) => u.role === "hod");

        const facultyOptions = [
          ...(hodUser ? [{ name: hodUser.name || "HOD", email: hodUser.username, role: "HOD" }] : []),
          ...faculty.map((f: any) => ({ name: f.name, email: f.email, role: "Faculty" })),
        ];
        setFacultyList(facultyOptions);
      }
    };

    loadFaculty();
    fetchProjects();
  }, [studentId])

  const saveProject = async (projectData: any, type: string, setIdFn: (id: string) => void) => {
    try {
      // If ID exists, delete old first (hack for lack of Update endpoint).
      if (projectData.id) {
        await api.delete(`/students/${studentId}/projects/${projectData.id}`);
      }

      const res = await api.post(`/students/${studentId}/projects`, {
        title: projectData.title,
        description: projectData.description,
        technologies: projectData.technologies,
        duration: projectData.duration,
        guide: projectData.guide,
        guideEmail: projectData.guideEmail,
        type: type,
        status: "pending", // Reset status on edit
        remarks: "", // Reset remarks on edit (or keep, but usually new submission resets)
        approvedAt: null
      });

      if (res.status === 200 || res.status === 201) {
        const saved = res.data;
        setIdFn(saved.id); // Update local ID
        alert("Project saved successfully!");
        fetchProjects(); // Refresh to ensure sync
      } else {
        alert("Failed to save project");
      }
    } catch (error) {
      console.error("Save project error", error);
      alert("Failed to save project");
    }
  }

  const handleSaveIntern = async () => {
    await saveProject(internProject, 'INTERNSHIP', (id) => setInternProject(prev => ({ ...prev, id })));
    setIsEditingIntern(false)
  }

  const handleSaveFinal = async () => {
    await saveProject(finalProject, 'FINAL_YEAR', (id) => setFinalProject(prev => ({ ...prev, id })));
    setIsEditingFinal(false)
  }

  const HistoryTimeline = ({ history }: { history: any[] }) => {
    if (!history || history.length === 0) return null;
    return (
      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground pl-1">Approval Journey</h4>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-muted before:via-muted before:to-transparent">
          {history.map((item, index) => (
            <div key={item.id || index} className="relative flex items-start gap-6 group">
              <div className={`mt-1.5 h-10 w-10 rounded-full border-4 border-background flex items-center justify-center shrink-0 z-10 shadow-sm transition-transform group-hover:scale-110 ${item.status === 'approved' ? 'bg-green-500 text-white' :
                  item.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </div>
              <div className="flex-1 bg-muted/30 hover:bg-muted/50 transition-colors p-4 rounded-2xl border border-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tighter ${item.status === 'approved' ? 'border-green-200 bg-green-50 text-green-700' :
                      item.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' :
                        'border-orange-200 bg-orange-50 text-orange-700'
                    }`}>
                    {item.status}
                  </Badge>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {format(new Date(item.createdAt), "MMM d, yyyy • p")}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{item.remarks}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold">
                    {item.actionBy?.[0] || 'U'}
                  </div>
                  <p className="text-[10px] text-muted-foreground">By <span className="font-bold">{item.actionBy || 'Unknown'}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Project Work</h2>
        <p className="text-sm text-muted-foreground">Add your internship and final year projects</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Internship Project</CardTitle>
              <Badge variant="outline">Optional</Badge>
              {internProject.status === "approved" && <Badge variant="default">Approved</Badge>}
              {internProject.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
              {internProject.status === "pending" && internProject.id && <Badge variant="secondary">Pending Approval</Badge>}
            </div>
            {!isEditingIntern ? (
              <Button onClick={() => setIsEditingIntern(true)}>
                {internProject.title ? "Edit Project" : "Add Project"}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditingIntern(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveIntern}>Save Project</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="internTitle">Project Title</Label>
            <Input
              id="internTitle"
              placeholder="Enter your internship project title"
              value={internProject.title}
              onChange={(e) => setInternProject({ ...internProject, title: e.target.value })}
              disabled={!isEditingIntern}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internDescription">Description</Label>
            <Textarea
              id="internDescription"
              placeholder="Describe your project, objectives, and outcomes"
              value={internProject.description}
              onChange={(e) => setInternProject({ ...internProject, description: e.target.value })}
              disabled={!isEditingIntern}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="internTech">Technologies Used</Label>
              <Input
                id="internTech"
                placeholder="e.g., React, Node.js, MongoDB"
                value={internProject.technologies}
                onChange={(e) => setInternProject({ ...internProject, technologies: e.target.value })}
                disabled={!isEditingIntern}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internDuration">Duration</Label>
              <Input
                id="internDuration"
                placeholder="e.g., 3 months"
                value={internProject.duration}
                onChange={(e) => setInternProject({ ...internProject, duration: e.target.value })}
                disabled={!isEditingIntern}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internGuide">Project Guide (Faculty/HOD)</Label>
            <Select
              value={internProject.guideEmail}
              onValueChange={(value) => {
                const selected = facultyList.find((f) => f.email === value)
                setInternProject({
                  ...internProject,
                  guideEmail: value,
                  guide: selected ? `${selected.name} (${selected.role})` : "",
                })
              }}
              disabled={!isEditingIntern}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a faculty guide" />
              </SelectTrigger>
              <SelectContent>
                {facultyList.map((faculty) => (
                  <SelectItem key={faculty.email} value={faculty.email}>
                    {faculty.name} ({faculty.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {internProject.guide && !isEditingIntern && (
              <p className="text-sm text-muted-foreground">Guide: {internProject.guide}</p>
            )}
          </div>

          {internProject.remarks && (
            <div className="bg-muted p-4 rounded-md border mt-4">
              <h4 className="text-sm font-semibold mb-1">Active Status Remarks</h4>
              <p className="text-sm text-muted-foreground mb-2">{internProject.remarks}</p>
              {internProject.approvedAt && internProject.status === 'approved' && (
                <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                  Finalized on: {format(new Date(internProject.approvedAt), "PPP p")}
                </p>
              )}
            </div>
          )}

          <HistoryTimeline history={internProject.history} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Final Year Project</CardTitle>
              {studentYear === "III" ? (
                <>
                  <Badge variant="default">Available</Badge>
                  {finalProject.status === "approved" && <Badge variant="default">Approved</Badge>}
                  {finalProject.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                  {finalProject.status === "pending" && finalProject.id && <Badge variant="secondary">Pending Approval</Badge>}
                </>
              ) : (
                <Badge variant="secondary">Unlocks in Year III</Badge>
              )}
            </div>
            {studentYear === "III" &&
              (!isEditingFinal ? (
                <Button onClick={() => setIsEditingFinal(true)}>
                  {finalProject.title ? "Edit Project" : "Add Project"}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditingFinal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFinal}>Save Project</Button>
                </div>
              ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {studentYear !== "III" ? (
            <div className="text-center py-8 text-muted-foreground">
              Final year project will be available when you reach Year III
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="finalTitle">Project Title</Label>
                <Input
                  id="finalTitle"
                  placeholder="Enter your final year project title"
                  value={finalProject.title}
                  onChange={(e) => setFinalProject({ ...finalProject, title: e.target.value })}
                  disabled={!isEditingFinal}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalDescription">Description</Label>
                <Textarea
                  id="finalDescription"
                  placeholder="Describe your project, objectives, and expected outcomes"
                  value={finalProject.description}
                  onChange={(e) => setFinalProject({ ...finalProject, description: e.target.value })}
                  disabled={!isEditingFinal}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalTech">Technologies Used</Label>
                <Input
                  id="finalTech"
                  placeholder="e.g., Python, TensorFlow, React"
                  value={finalProject.technologies}
                  onChange={(e) => setFinalProject({ ...finalProject, technologies: e.target.value })}
                  disabled={!isEditingFinal}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalGuide">Project Guide (Faculty/HOD)</Label>
                <Select
                  value={finalProject.guideEmail}
                  onValueChange={(value) => {
                    const selected = facultyList.find((f) => f.email === value)
                    setFinalProject({
                      ...finalProject,
                      guideEmail: value,
                      guide: selected ? `${selected.name} (${selected.role})` : "",
                    })
                  }}
                  disabled={!isEditingFinal}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a faculty guide" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultyList.map((faculty) => (
                      <SelectItem key={faculty.email} value={faculty.email}>
                        {faculty.name} ({faculty.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {finalProject.guide && !isEditingFinal && (
                  <p className="text-sm text-muted-foreground">Guide: {finalProject.guide}</p>
                )}
              </div>

              {finalProject.remarks && (
                <div className="bg-muted p-4 rounded-md border mt-4">
                  <h4 className="text-sm font-semibold mb-1">Active Status Remarks</h4>
                  <p className="text-sm text-muted-foreground mb-2">{finalProject.remarks}</p>
                  {finalProject.approvedAt && finalProject.status === 'approved' && (
                    <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                      Finalized on: {format(new Date(finalProject.approvedAt), "PPP p")}
                    </p>
                  )}
                </div>
              )}

              <HistoryTimeline history={finalProject.history} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
