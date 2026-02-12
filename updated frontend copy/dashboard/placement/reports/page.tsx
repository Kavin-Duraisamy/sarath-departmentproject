"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function ReportsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [reports, setReports] = useState<any>({
    placementPercentage: 0,
    avgPackage: "0",
    highestPackage: "0",
    totalOffers: 0,
    companyWise: [] as any[],
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData) return

    if (userData.role?.toLowerCase() !== "placement") {
      router.push(`/dashboard/${userData.role?.toLowerCase()}`)
      return
    }

    setUser(userData)

    // Calculate reports
    const students = JSON.parse(localStorage.getItem("students") || "[]").filter((s: any) => s.year === "III")
    const applications = JSON.parse(localStorage.getItem("applications") || "[]")
    const companies = JSON.parse(localStorage.getItem("companies") || "[]")

    const placedStudents = new Set(
      applications.filter((app: any) => app.status === "placed").map((a: any) => a.studentId),
    )
    const placementPercentage = students.length > 0 ? Math.round((placedStudents.size / students.length) * 100) : 0

    const companyWise = companies.map((company: any) => {
      const companyApplications = applications.filter((app: any) => app.companyId === company.id)
      const placed = companyApplications.filter((app: any) => app.status === "placed").length
      return {
        name: company.name,
        registered: companyApplications.length,
        placed,
      }
    })

    setReports({
      placementPercentage,
      avgPackage: "7.5",
      highestPackage: "12",
      totalOffers: placedStudents.size,
      companyWise,
    })
  }, [router])

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
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Placement Reports</h2>
          <p className="text-muted-foreground">View placement statistics and analytics</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Placement %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reports.placementPercentage}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Package</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reports.avgPackage} LPA</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Highest Package</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reports.highestPackage} LPA</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reports.totalOffers}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company-wise Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.companyWise.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No company data available</p>
            ) : (
              <div className="space-y-4">
                {reports.companyWise.map((company: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Registered: {company.registered} | Placed: {company.placed}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
