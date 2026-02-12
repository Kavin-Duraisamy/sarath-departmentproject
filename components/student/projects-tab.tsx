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
  })
  const [finalProject, setFinalProject] = useState({
    id: "",
    title: "",
    description: "",
    technologies: "",
    guide: "",
    guideEmail: "",
    status: "pending",
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
            status: intern.status || "pending"
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
            status: final.status || "pending"
          });
        }
      }
    } catch (error) {
      console.error("Fetch projects error", error);
    }
  }

  useEffect(() => {
    // Load faculty for dropdown (keep using localStorage for faculty list as that might be static or fetched elsewhere)
    // Actually faculty list should probably come from API too, but let's stick to localStorage for that reference data if it works.
    const faculty = JSON.parse(localStorage.getItem("faculty") || "[]")
    const staffLogins = JSON.parse(localStorage.getItem("staffLogins") || "[]")
    const hodUser = staffLogins.find((u: any) => u.role === "hod")

    const facultyOptions = [
      ...(hodUser ? [{ name: hodUser.name || "HOD", email: hodUser.username, role: "HOD" }] : []),
      ...faculty.map((f: any) => ({ name: f.name, email: f.email, role: "Faculty" })),
    ]

    setFacultyList(facultyOptions)

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
        duration: projectData.duration, // Optional for final year
        guide: projectData.guide,
        guideEmail: projectData.guideEmail,
        type: type,
        status: "pending" // Reset status on edit? Or keep? Schema default is pending. 
      });

      if (res.status === 200 || res.status === 201) {
        const saved = res.data;
        setIdFn(saved.id); // Update local ID
        alert("Project saved successfully!");
        fetchProjects();
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
