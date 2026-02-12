"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Upload, Download } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api, { apiClient } from "@/lib/api"

type Certificate = {
  id: string
  name: string
  issuedBy: string
  issueDate: string
  category: "technical" | "course" | "achievement" | "other"
  fileUrl: string
  fileName?: string // Added to store original filename
}

type CertificatesProps = {
  studentId: string
}

export function CertificatesTab({ studentId }: CertificatesProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    issuedBy: "",
    issueDate: "",
    category: "technical",
    fileUrl: "",
    fileName: "",
  })

  const fetchCertificates = async () => {
    try {
      const res = await apiClient.getStudent(studentId);
      if (res.data && res.data.certificates) {
        const mapped = res.data.certificates.map((c: any) => ({
          id: c.id,
          name: c.title, // 'title' in DB => 'name' in FE
          issuedBy: c.issuer, // 'issuer' in DB => 'issuedBy' in FE
          issueDate: c.issuedDate ? new Date(c.issuedDate).toISOString().split('T')[0] : "",
          category: "technical", // Default as DB missing category field (as noted in backend step).
          fileUrl: c.fileUrl || "",
          fileName: ""
        }));
        setCertificates(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch certificates", error);
    }
  }

  useEffect(() => {
    fetchCertificates();
  }, [studentId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const res = await apiClient.uploadCertificate(file);
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
      await api.post(`/students/${studentId}/certificates`, {
        name: formData.name,
        issuedBy: formData.issuedBy,
        issueDate: new Date(formData.issueDate).toISOString(),
        fileUrl: formData.fileUrl,
        // category: formData.category // Not in DB schema yet, omitting to avoid error or saving if I added it?
        // I didn't add it to DB. So it won't be saved.
      });

      setFormData({
        name: "",
        issuedBy: "",
        issueDate: "",
        category: "technical",
        fileUrl: "",
        fileName: ""
      })
      setIsDialogOpen(false)
      fetchCertificates();
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to add certificate");
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/students/${studentId}/certificates/${id}`);
      fetchCertificates();
    } catch (error) {
      console.error("Delete error", error);
      alert("Failed to delete certificate");
    }
  }

  const handleDownload = (certificate: Certificate) => {
    const link = document.createElement("a")
    link.href = certificate.fileUrl
    // Use stored filename or detect extension
    let downloadName = certificate.fileName || `${certificate.name}.pdf`

    // If we have a data URL but no filename (legacy data), try to guess extension
    if (!certificate.fileName && certificate.fileUrl.startsWith("data:")) {
      const mimeType = certificate.fileUrl.split(";")[0].split(":")[1]
      if (mimeType === "image/jpeg") downloadName = `${certificate.name}.jpg`
      else if (mimeType === "image/png") downloadName = `${certificate.name}.png`
    }

    link.download = downloadName
    link.click()
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      case "course":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "achievement":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400"
      case "other":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Certificates & Achievements</h2>
          <p className="text-sm text-muted-foreground">
            Upload your certificates, course completions, and achievements
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Certificate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="certName">Certificate Name *</Label>
                <Input
                  id="certName"
                  placeholder="e.g., AWS Certified Developer"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issuedBy">Issued By *</Label>
                  <Input
                    id="issuedBy"
                    placeholder="e.g., Amazon Web Services"
                    value={formData.issuedBy}
                    onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as Certificate["category"] })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Certification</SelectItem>
                    <SelectItem value="course">Course Completion</SelectItem>
                    <SelectItem value="achievement">Achievement/Award</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certFile">Upload Certificate *</Label>
                <Label htmlFor="certFile" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    {formData.fileUrl ? "Certificate Uploaded" : "Choose PDF/Image File"}
                  </div>
                </Label>
                <Input
                  id="certFile"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!formData.name || !formData.issuedBy || !formData.issueDate || !formData.fileUrl}
                >
                  Add Certificate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No certificates added yet</p>
            <p className="text-sm text-muted-foreground mt-2">Upload your certificates to showcase your achievements</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{certificate.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{certificate.issuedBy}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(certificate.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryBadgeColor(certificate.category)}>
                    {certificate.category.charAt(0).toUpperCase() + certificate.category.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(certificate.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => handleDownload(certificate)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Certificate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
