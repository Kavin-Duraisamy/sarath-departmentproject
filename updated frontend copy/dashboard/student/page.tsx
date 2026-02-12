"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, GraduationCap, Briefcase, FileText, FolderGit2, LogOut, Calendar, Bell, Award } from "lucide-react"
import { BasicInfoTab } from "@/components/student/basic-info-tab"
import { AcademicsTab } from "@/components/student/academics-tab"
import { InternshipsTab } from "@/components/student/internships-tab"
import { ResumesTab } from "@/components/student/resumes-tab"
import { ProjectsTab } from "@/components/student/projects-tab"
import { CertificatesTab } from "@/components/student/certificates-tab"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { useSession, signOut } from "next-auth/react"
import { getStudentProfile } from "@/actions/student-actions"

export default function StudentDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [studentData, setStudentData] = useState<any>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    if (status === "authenticated") {
      if (session.user.role !== "STUDENT" && session.user.role !== "student") {
        router.push(`/dashboard/${session.user.role?.toLowerCase()}`)
        return
      }

      const loadData = async () => {
        try {
          const profile = await getStudentProfile()
          if (profile) {
            setStudentData(profile)
          }
        } catch (e) {
          console.error(e)
        }
      }
      loadData()
    }
  }, [status, session, router])

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  if (status === "loading" || !session || !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground italic">Loading your profile...</p>
      </div>
    )
  }

  const user = session.user

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Student Portal</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {user.name} ({studentData.rollNumber})
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/student/timetable")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                View Timetable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Check your class schedule and timings</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/student/notifications")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View announcements and updates</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="academics">
              <GraduationCap className="h-4 w-4 mr-2" />
              Academics
            </TabsTrigger>
            <TabsTrigger value="internships">
              <Briefcase className="h-4 w-4 mr-2" />
              Internships
            </TabsTrigger>
            <TabsTrigger value="resumes">
              <FileText className="h-4 w-4 mr-2" />
              Resumes
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderGit2 className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <BasicInfoTab studentData={studentData} studentId={studentData.id} />
          </TabsContent>

          <TabsContent value="academics">
            <AcademicsTab studentId={studentData.id} />
          </TabsContent>

          <TabsContent value="internships">
            <InternshipsTab studentId={studentData.id} />
          </TabsContent>

          <TabsContent value="resumes">
            <ResumesTab studentId={studentData.id} />
          </TabsContent>

          <TabsContent value="certificates">
            <CertificatesTab studentId={studentData.id} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsTab studentId={studentData.id} studentYear={studentData.year} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
