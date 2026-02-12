"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ApplicationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(storedUser)
    if (userData.role !== "placement") {
      router.push(`/dashboard/${userData.role}`)
      return
    }

    setUser(userData)

    // Load applications
    const storedApplications = localStorage.getItem("applications")
    if (storedApplications) {
      setApplications(JSON.parse(storedApplications))
    }
  }, [router])

  const handleMarkPlaced = (applicationId: string) => {
    const updated = applications.map((app) => (app.id === applicationId ? { ...app, status: "placed" } : app))
    setApplications(updated)
    localStorage.setItem("applications", JSON.stringify(updated))
  }

  const filteredApplications =
    statusFilter === "all" ? applications : applications.filter((app) => app.status === statusFilter)

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/placement")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight mb-2">Student Applications</h2>
            <p className="text-muted-foreground">View and manage placement applications</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{application.studentName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.studentRollNumber} - Applied for {application.companyName}
                      </p>
                    </div>
                    <Badge variant={application.status === "placed" ? "default" : "secondary"}>
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Role:</span> {application.role}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Package:</span> {application.package}
                    </div>
                  </div>
                  {application.status !== "placed" && (
                    <div className="mt-4">
                      <Button size="sm" onClick={() => handleMarkPlaced(application.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Placed
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
