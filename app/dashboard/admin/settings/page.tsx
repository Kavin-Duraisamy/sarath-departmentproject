"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Shield, Bell, Zap } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"

export default function SystemConfigurationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    instituteName: "",
    academicYear: "",
    semester: "Odd",
    minCGPA: 6.0,
    enableNotifications: true,
    enableProjectSimilarity: true,
    similarityThreshold: 60,
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

    fetchSettings()
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await apiClient.getSystemSettings()
      if (res.data) {
        setConfig({
          instituteName: res.data.instituteName,
          academicYear: res.data.academicYear,
          semester: res.data.semester,
          minCGPA: res.data.minCGPA,
          enableNotifications: res.data.enableNotifications,
          enableProjectSimilarity: res.data.enableProjectSimilarity,
          similarityThreshold: res.data.similarityThreshold,
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings", error)
      toast({ title: "Error", description: "Failed to load system settings", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiClient.updateSystemSettings(config)
      toast({ title: "Success", description: "System configuration updated successfully" })
    } catch (error) {
      console.error("Failed to update settings", error)
      toast({ title: "Error", description: "Failed to update system settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">System Configuration</h1>
                <p className="text-sm text-muted-foreground">Manage global institute settings and preferences</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                General Academic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="instituteName">Institute Name</Label>
                <Input
                  id="instituteName"
                  value={config.instituteName}
                  onChange={(e) => setConfig({ ...config, instituteName: e.target.value })}
                  placeholder="Ex: Department of Computer Science"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Current Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={config.academicYear}
                    onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                    placeholder="Ex: 2024-2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Active Semester</Label>
                  <select
                    id="semester"
                    value={config.semester}
                    onChange={(e) => setConfig({ ...config, semester: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background font-medium"
                  >
                    <option value="Odd">Odd Semester</option>
                    <option value="Even">Even Semester</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 max-w-xs">
                <Label htmlFor="minCGPA">Placement Eligibility (Min CGPA)</Label>
                <Input
                  id="minCGPA"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10.0"
                  value={config.minCGPA}
                  onChange={(e) => setConfig({ ...config, minCGPA: parseFloat(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                System Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-lg flex items-center gap-2 font-bold uppercase tracking-tight">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    Automated Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Synchronize email and portal notifications for all users</p>
                </div>
                <Switch
                  checked={config.enableNotifications}
                  onCheckedChange={(checked) => setConfig({ ...config, enableNotifications: checked })}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-lg font-bold uppercase tracking-tight">Project Similarity Analysis</Label>
                    <p className="text-sm text-muted-foreground">Detect potential plagiarism in student project submissions</p>
                  </div>
                  <Switch
                    checked={config.enableProjectSimilarity}
                    onCheckedChange={(checked) => setConfig({ ...config, enableProjectSimilarity: checked })}
                  />
                </div>

                {config.enableProjectSimilarity && (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <Label htmlFor="similarityThreshold" className="font-semibold">Similarity Threshold</Label>
                          <span className="text-2xl font-black text-primary">{config.similarityThreshold}%</span>
                        </div>
                        <input
                          type="range"
                          id="similarityThreshold"
                          min="0"
                          max="100"
                          step="5"
                          value={config.similarityThreshold}
                          onChange={(e) => setConfig({ ...config, similarityThreshold: parseInt(e.target.value) })}
                          className="w-full h-2 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                          <span>LENIENT (0%)</span>
                          <span>STRICT (100%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-12">
            <Button variant="ghost" onClick={fetchSettings} disabled={saving}>Reset to Current</Button>
            <Button
              onClick={handleSave}
              className="px-12 h-12 text-lg shadow-lg shadow-primary/20"
              disabled={saving}
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? "Saving Changes..." : "Apply Configuration"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
