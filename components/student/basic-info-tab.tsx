"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"
import { apiClient } from "@/lib/api"

type BasicInfoProps = {
  studentData: any
  studentId: string
  onProfileUpdate?: () => void
}

export function BasicInfoTab({ studentData, studentId, onProfileUpdate }: BasicInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [profilePic, setProfilePic] = useState("")
  const [formData, setFormData] = useState({
    skills: "",
    communicationCategory: "",
    address: "",
    bloodGroup: "",
    fatherName: "",
    fatherPhone: "",
    motherName: "",
    motherPhone: "",
    guardianName: "",
    guardianPhone: "",
  })

  useEffect(() => {
    // Populate from props (which come from API) instead of localStorage
    setFormData({
      skills: studentData.skills || "",
      communicationCategory: studentData.communicationCategory || "",
      address: studentData.address || "",
      bloodGroup: studentData.bloodGroup || "",
      fatherName: studentData.fatherName || "",
      fatherPhone: studentData.fatherPhone || "",
      motherName: studentData.motherName || "",
      motherPhone: studentData.motherPhone || "",
      guardianName: studentData.guardianName || "",
      guardianPhone: studentData.guardianPhone || "",
    })
    setProfilePic(studentData.profilePic || "")
  }, [studentData])

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        profilePic,
      };

      // Debug alert
      alert(`Debug: Sending data: ${JSON.stringify(payload)}`);

      await apiClient.updateStudentProfile(studentId, payload);

      alert("Profile updated successfully!");
      setIsEditing(false);
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || "Failed to save changes";
      alert(`Error: ${msg}`);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const res = await apiClient.uploadProfilePhoto(file);
        setProfilePic(res.data.url);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload photo");
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Basic Information & Profile</CardTitle>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profilePic || "/placeholder.svg"} />
            <AvatarFallback className="text-2xl">{studentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {isEditing && (
            <div>
              <Label htmlFor="profilePic" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  {profilePic.startsWith("http") ? "Change Photo" : "Upload Photo"}
                </div>
              </Label>
              <Input id="profilePic" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={studentData.name} disabled />
          </div>
          <div className="space-y-2">
            <Label>Roll Number</Label>
            <Input value={studentData.rollNumber} disabled />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={studentData.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={studentData.phone} disabled />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Year</Label>
            <Input value={`Year ${studentData.year}`} disabled />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={studentData.department} disabled />
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input value={studentData.dob} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Skills (comma separated)</Label>
          <Textarea
            id="skills"
            placeholder="e.g., Python, React, Machine Learning, Data Structures"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            disabled={!isEditing}
            rows={3}
          />
        </div>

        {studentData.year === "III" && (
          <div className="space-y-2">
            <Label htmlFor="communicationCategory">Communication Category (Final Year Only)</Label>
            <Select
              value={formData.communicationCategory}
              onValueChange={(value) => setFormData({ ...formData, communicationCategory: value })}
              disabled={!isEditing}
            >
              <SelectTrigger id="communicationCategory">
                <SelectValue placeholder="Select communication category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="below-average">Below Average</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="Enter your full address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={!isEditing}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Input
              id="bloodGroup"
              placeholder="e.g., A+, O-, B+"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name</Label>
              <Input
                id="fatherName"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherPhone">Father's Phone</Label>
              <Input
                id="fatherPhone"
                value={(formData as any).fatherPhone}
                onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value } as any)}
                disabled={!isEditing}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="motherName">Mother's Name</Label>
              <Input
                id="motherName"
                value={formData.motherName}
                onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherPhone">Mother's Phone</Label>
              <Input
                id="motherPhone"
                value={(formData as any).motherPhone}
                onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value } as any)}
                disabled={!isEditing}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                value={(formData as any).guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value } as any)}
                disabled={!isEditing}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian Contact Number</Label>
              <Input
                id="guardianPhone"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
