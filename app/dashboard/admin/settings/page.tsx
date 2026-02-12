"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"

import { useSession } from "next-auth/react"

export default function SystemConfigurationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [config, setConfig] = useState({
    instituteName: "Department of Computer Science",
    academicYear: "2024-2025",
    semester: "Odd",
    minCGPA: "6.0",
    enableNotifications: true,
    enableProjectSimilarity: true,
    similarityThreshold: "60",
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (session?.user?.role !== "admin") {
      router.push("/")
      return
    }

    const stored = localStorage.getItem("systemConfig")
    if (stored) {
      setConfig(JSON.parse(stored))
    }
  }, [session, status, router])

  const handleSave = () => {
    localStorage.setItem("systemConfig", JSON.stringify(config))
    alert("Configuration saved successfully!")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">System Configuration</h1>
              <p className="text-sm text-muted-foreground">Configure system settings and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="instituteName">Institute Name</Label>
              <Input
                id="instituteName"
                value={config.instituteName}
                onChange={(e) => setConfig({ ...config, instituteName: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  value={config.academicYear}
                  onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Current Semester</Label>
                <select
                  id="semester"
                  value={config.semester}
                  onChange={(e) => setConfig({ ...config, semester: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="Odd">Odd</option>
                  <option value="Even">Even</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minCGPA">Minimum CGPA for Placements</Label>
              <Input
                id="minCGPA"
                type="number"
                step="0.1"
                value={config.minCGPA}
                onChange={(e) => setConfig({ ...config, minCGPA: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Allow system to send notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableNotifications}
                  onChange={(e) => setConfig({ ...config, enableNotifications: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Project Similarity Detection</Label>
                  <p className="text-sm text-muted-foreground">Use AI to detect similar projects</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableProjectSimilarity}
                  onChange={(e) => setConfig({ ...config, enableProjectSimilarity: e.target.checked })}
                  className="w-5 h-5"
                />
              </div>

              {config.enableProjectSimilarity && (
                <div className="space-y-2 ml-4">
                  <Label htmlFor="similarityThreshold">Similarity Threshold (%)</Label>
                  <Input
                    id="similarityThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={config.similarityThreshold}
                    onChange={(e) => setConfig({ ...config, similarityThreshold: e.target.value })}
                  />
                </div>
              )}
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
