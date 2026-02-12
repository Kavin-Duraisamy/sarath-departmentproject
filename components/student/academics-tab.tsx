"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import api, { apiClient } from "@/lib/api"

type AcademicsProps = {
  studentId: string
}

export function AcademicsTab({ studentId }: AcademicsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sem1: { sgpa: "", arrears: "" },
    sem2: { sgpa: "", arrears: "" },
    sem3: { sgpa: "", arrears: "" },
    sem4: { sgpa: "", arrears: "" },
    sem5: { sgpa: "", arrears: "" },
    sem6: { sgpa: "", arrears: "" },
    cgpa: "",
  })

  useEffect(() => {
    const fetchAcademics = async () => {
      try {
        const res = await apiClient.getStudent(studentId);
        if (res.data && res.data.academicRecords) {
          const newFormData: any = { ...formData };
          let totalSgpa = 0;
          let count = 0;

          res.data.academicRecords.forEach((rec: any) => {
            const semKey = `sem${rec.semester}`;
            if (newFormData[semKey]) {
              newFormData[semKey] = {
                sgpa: rec.sgpa?.toString() || "",
                arrears: rec.arrears?.toString() || ""
              };
              if (rec.sgpa) {
                totalSgpa += rec.sgpa;
                count++;
              }
            }
          });

          newFormData.cgpa = count > 0 ? (totalSgpa / count).toFixed(2) : "0";
          setFormData(newFormData);
        }
      } catch (error) {
        console.error("Fetch academics error", error);
      }
    };
    fetchAcademics();
  }, [studentId])

  const handleSave = async () => {
    // Calculate CGPA locally
    let totalSgpa = 0
    let count = 0
    const semestersPayload: { semester: string; sgpa: string; arrears: string }[] = [];

    Object.keys(formData).forEach((key) => {
      if (key.startsWith("sem")) {
        const semNum = key.replace("sem", "");
        const data = formData[key as keyof typeof formData] as any;
        if (data.sgpa) {
          totalSgpa += Number.parseFloat(data.sgpa || "0");
          count++;
        }
        semestersPayload.push({
          semester: semNum,
          sgpa: data.sgpa,
          arrears: data.arrears
        });
      }
    })
    const cgpa = count > 0 ? (totalSgpa / count).toFixed(2) : "0"

    try {
      await api.post(`/students/${studentId}/academics`, {
        semesters: semestersPayload,
        cgpa: cgpa // Optional, backend might ignore
      });

      setFormData(prev => ({ ...prev, cgpa }));
      setIsEditing(false);
      alert("Academics saved successfully");
    } catch (error) {
      console.error("Save academics error", error);
      alert("Failed to save academics");
    }
  }

  const updateSemester = (sem: string, field: string, value: string) => {
    setFormData({
      ...formData,
      [sem]: {
        ...(formData[sem as keyof typeof formData] as any),
        [field]: value,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Academic Performance</CardTitle>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Marks</Button>
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
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((semNum) => {
            const semKey = `sem${semNum}` as keyof typeof formData
            const semData = formData[semKey] as any
            return (
              <Card key={semNum} className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Semester {semNum}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${semKey}-sgpa`}>SGPA</Label>
                    <Input
                      id={`${semKey}-sgpa`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="0.00"
                      value={semData.sgpa}
                      onChange={(e) => updateSemester(semKey, "sgpa", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${semKey}-arrears`}>Arrears</Label>
                    <Input
                      id={`${semKey}-arrears`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={semData.arrears}
                      onChange={(e) => updateSemester(semKey, "arrears", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Overall CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formData.cgpa || "Not Calculated"}</div>
            <p className="text-sm text-muted-foreground mt-2">Automatically calculated from all semester SGPAs</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
