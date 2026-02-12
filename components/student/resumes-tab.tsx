"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Upload, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import api, { apiClient } from "@/lib/api"

type Resume = {
  id: string
  name: string
  fileUrl: string
  fileName?: string // Added
  uploadedAt: string
  isActive: boolean
}

type ResumesProps = {
  studentId: string
}

export function ResumesTab({ studentId }: ResumesProps) {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    fileUrl: "",
    fileName: "",
  })

  const fetchResumes = async () => {
    try {
      const res = await apiClient.getStudent(studentId);
      if (res.data && res.data.resumes) {
        const mapped = res.data.resumes.map((r: any, index: number) => ({
          id: r.id,
          name: r.title,
          fileUrl: r.fileUrl,
          uploadedAt: r.uploadedAt,
          isActive: index === 0 // Default first to active
        }));
        setResumes(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch resumes", error);
    }
  }

  useEffect(() => {
    fetchResumes();
  }, [studentId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Use apiClient for upload
        const res = await apiClient.uploadResume(file);
        setFormData({
          ...formData,
          fileUrl: res.data.url,
          fileName: file.name
        });
      } catch (error) {
        console.error("Upload error", error);
        alert("File upload error");
      }
    }
  }

  const handleAdd = async () => {
    try {
      // Manually calling axios for specific post if not in helper, or creating helper
      // Since addResume logic isn't in apiClient, we use the `api` instance directly
      await api.post(`/students/${studentId}/resumes`, {
        name: formData.name,
        fileUrl: formData.fileUrl
      });

      setFormData({ name: "", fileUrl: "", fileName: "" });
      setIsDialogOpen(false);
      fetchResumes();
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save resume");
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/students/${studentId}/resumes/${id}`);
      fetchResumes();
    } catch (error) {
      console.error("Delete error", error);
      alert("Failed to delete resume");
    }
  }

  const handleSetActive = (id: string) => {
    // Only local toggle for now as backend doesn't support isActive
    const updated = resumes.map((r) => ({ ...r, isActive: r.id === id }))
    setResumes(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Resumes</h2>
          <p className="text-sm text-muted-foreground">Upload multiple resume versions and set one as active</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Resume</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="resumeName">Resume Name *</Label>
                <Input
                  id="resumeName"
                  placeholder="e.g., Software Developer Resume, Data Science Resume"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumeFile">Upload File *</Label>
                <Label htmlFor="resumeFile" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    {formData.fileUrl ? "Resume Uploaded" : "Choose PDF File"}
                  </div>
                </Label>
                <Input
                  id="resumeFile"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!formData.name || !formData.fileUrl}>
                  Upload Resume
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No resumes uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-2">Upload your resume to apply for placements</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {resumes.map((resume) => (
            <Card key={resume.id} className={resume.isActive ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{resume.name}</CardTitle>
                      {resume.isActive && (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Uploaded on {new Date(resume.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!resume.isActive && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActive(resume.id)}>
                        <Check className="h-4 w-4 mr-2" />
                        Set Active
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(resume.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
