"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import api, { apiClient } from "@/lib/api"

type Internship = {
  id: string
  company: string
  role: string
  duration: string
  description: string
  certificateUrl: string
  certificateFileName?: string // Added
}

type InternshipsProps = {
  studentId: string
}

export function InternshipsTab({ studentId }: InternshipsProps) {
  const [internships, setInternships] = useState<Internship[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    duration: "",
    description: "",
    certificateUrl: "",
    certificateFileName: "",
  })

  const fetchInternships = async () => {
    try {
      const res = await apiClient.getStudent(studentId);
      if (res.data && res.data.internships) {
        const mapped = res.data.internships.map((i: any) => ({
          id: i.id,
          company: i.company,
          role: i.role,
          duration: i.duration,
          description: i.description || "",
          certificateUrl: i.certificate || "",
          certificateFileName: ""
        }));
        setInternships(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch internships", error);
    }
  }

  useEffect(() => {
    fetchInternships();
  }, [studentId])

  const handleAdd = async () => {
    try {
      await api.post(`/students/${studentId}/internships`, {
        company: formData.company,
        role: formData.role,
        duration: formData.duration,
        description: formData.description,
        certificateUrl: formData.certificateUrl
      });

      setFormData({
        company: "",
        role: "",
        duration: "",
        description: "",
        certificateUrl: "",
        certificateFileName: "",
      })
      setIsDialogOpen(false)
      fetchInternships();
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to add internship");
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/students/${studentId}/internships/${id}`);
      fetchInternships();
    } catch (error) {
      console.error("Delete error", error);
      alert("Failed to delete internship");
    }
  }

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const res = await apiClient.uploadCertificate(file);
        setFormData({
          ...formData,
          certificateUrl: res.data.url,
          certificateFileName: file.name
        });
      } catch (error) {
        console.error("Upload error", error);
        alert("File upload error");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Internships & Experience</h2>
          <p className="text-sm text-muted-foreground">Add your internship experience and upload certificates</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Internship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Internship Experience</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role/Position *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration *</Label>
                <Input
                  id="duration"
                  placeholder="e.g., May 2024 - July 2024"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your responsibilities and achievements"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate">Certificate (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="certificate" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      {formData.certificateUrl ? "Certificate Uploaded" : "Upload Certificate"}
                    </div>
                  </Label>
                  <Input
                    id="certificate"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleCertificateUpload}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={!formData.company || !formData.role || !formData.duration}>
                  Add Internship
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {internships.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No internships added yet</p>
            <p className="text-sm text-muted-foreground mt-2">Add your internship experience to showcase your skills</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {internships.map((internship) => (
            <Card key={internship.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{internship.company}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{internship.role}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(internship.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{internship.duration}</Badge>
                  {internship.certificateUrl && <Badge variant="secondary">Certificate Uploaded</Badge>}
                </div>
                {internship.description && <p className="text-sm text-muted-foreground">{internship.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
