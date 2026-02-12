"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, Upload, Trash2, Database } from "lucide-react"

import { useSession } from "next-auth/react"
import { useEffect } from "react"

export default function DataManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }
    if (session?.user?.role !== "admin") {
      router.push("/")
    }
  }, [session, status, router])

  const handleExportData = () => {
    const data = {
      students: JSON.parse(localStorage.getItem("students") || "[]"),
      studentLogins: JSON.parse(localStorage.getItem("studentLogins") || "[]"),
      staffLogins: JSON.parse(localStorage.getItem("staffLogins") || "[]"),
      companies: JSON.parse(localStorage.getItem("companies") || "[]"),
      notifications: JSON.parse(localStorage.getItem("notifications") || "[]"),
      progressionHistory: JSON.parse(localStorage.getItem("progressionHistory") || "[]"),
      archivedBatches: JSON.parse(localStorage.getItem("archivedBatches") || "[]"),
      systemConfig: JSON.parse(localStorage.getItem("systemConfig") || "{}"),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `system-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)

          if (confirm("This will overwrite all existing data. Continue?")) {
            Object.keys(data).forEach((key) => {
              localStorage.setItem(key, JSON.stringify(data[key]))
            })
            alert("Data imported successfully! Please refresh the page.")
          }
        } catch (error) {
          alert("Invalid backup file")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleClearData = () => {
    if (!confirm("This will delete ALL data permanently. Are you absolutely sure?")) return
    if (!confirm("Last warning: This action cannot be undone!")) return

    const keysToKeep = ["user"]
    const allKeys = Object.keys(localStorage)
    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    alert("All data cleared successfully!")
    router.push("/dashboard/admin")
  }

  const getDataStats = () => {
    return {
      students: JSON.parse(localStorage.getItem("students") || "[]").length,
      staff: JSON.parse(localStorage.getItem("staffLogins") || "[]").length,
      companies: JSON.parse(localStorage.getItem("companies") || "[]").length,
      notifications: JSON.parse(localStorage.getItem("notifications") || "[]").length,
      archived: JSON.parse(localStorage.getItem("archivedBatches") || "[]").length,
    }
  }

  const stats = getDataStats()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Data Management</h1>
              <p className="text-sm text-muted-foreground">Backup, restore, and manage system data</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Current Data Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Total Students</span>
                  <span className="font-semibold">{stats.students}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Staff Users</span>
                  <span className="font-semibold">{stats.staff}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Companies</span>
                  <span className="font-semibold">{stats.companies}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Notifications</span>
                  <span className="font-semibold">{stats.notifications}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Archived Batches</span>
                  <span className="font-semibold">{stats.archived}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button onClick={handleExportData} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data (Backup)
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Download all system data as a JSON file for backup purposes
                </p>
              </div>

              <div>
                <Button onClick={handleImportData} variant="outline" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data (Restore)
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Restore data from a previously exported backup file
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleClearData} variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Permanently delete all system data. This action cannot be undone!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
