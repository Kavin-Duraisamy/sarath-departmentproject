"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, RefreshCw, AlertCircle, Undo2, FastForward, Eye, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

export default function BatchProgressionPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [batchStats, setBatchStats] = useState({
    toBePromotedToII: 0,
    toBePromotedToIII: 0,
    toBeGraduated: 0,
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [progressionPreview, setProgressionPreview] = useState<any>(null)

  const [archivedStudents, setArchivedStudents] = useState<any[]>([])
  const [progressionHistory, setProgressionHistory] = useState<any[]>([])

  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false)
  const [progressionDescription, setProgressionDescription] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "hod") {
      if (userData) {
        // router.push(`/dashboard/${userData.role}`) // Optional: redirect to their dashboard
      } else {
        router.push("/")
      }
      return
    }

    setUser(userData)
    loadData(userData.department)
  }, [session, status, router])

  const loadData = async (department?: string) => {
    setLoading(true)
    try {
      const [statsRes, historyRes, alumniRes] = await Promise.all([
        apiClient.previewProgression(department),
        apiClient.getProgressionHistory(),
        apiClient.getStudents({ type: 'alumni' }) // We might need to filter by department in backend if not already done by controller for HOD
      ])

      setBatchStats(statsRes.data)
      setProgressionHistory(historyRes.data)
      setArchivedStudents(alumniRes.data)
    } catch (error) {
      console.error("Failed to load data", error)
      toast.error("Failed to load batch data")
    } finally {
      setLoading(false)
    }
  }

  const getArchivedBatchesByYear = () => {
    const grouped: { [year: number]: any[] } = {}
    archivedStudents.forEach((student: any) => {
      const year = student.passedOutYear || new Date(student.updatedAt).getFullYear() // Fallback
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(student)
    })
    return Object.entries(grouped)
      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      .map(([year, students]) => ({
        year: Number(year),
        students,
        count: students.length,
      }))
  }

  const handlePreviewProgression = () => {
    // We already have stats from loadData, but let's refresh just in case
    setProgressionPreview({
      toBePassedOut: batchStats.toBeGraduated,
      iToII: batchStats.toBePromotedToII,
      iiToIII: batchStats.toBePromotedToIII,
    })
    setIsDialogOpen(true)
  }

  const handleConfirmProgression = async () => {
    try {
      const nextYear = new Date().getFullYear() + 1;
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${nextYear}`;

      await apiClient.promoteBatch({
        department: user.department,
        academicYear,
        description: progressionDescription || `Regular batch promotion for ${academicYear}`
      });

      toast.success("Batch progression completed successfully!");
      setIsDialogOpen(false);
      loadData(user.department);
    } catch (error) {
      console.error("Progression failed", error);
      toast.error("Failed to progress batch");
    }
  }

  const handleRollbackProgression = async (progressionId: string) => {
    try {
      await apiClient.rollbackProgression(progressionId);
      toast.success("Progression rolled back successfully!");
      loadData(user.department);
    } catch (error) {
      console.error("Rollback failed", error);
      toast.error("Failed to rollback progression");
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/hod")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight mb-2">Batch Progression</h2>
          <p className="text-muted-foreground">Progress all batches to the next academic year</p>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">Current Batches</TabsTrigger>
            <TabsTrigger value="archived">Archived Batches ({getArchivedBatchesByYear().length})</TabsTrigger>
            <TabsTrigger value="history">Progression History ({progressionHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action will progress all students to the next year, mark Year III students as passed out.
                Existing final year students will be moved to Alumni.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">First Year (I)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{batchStats.toBePromotedToII}</div>
                  <p className="text-sm text-muted-foreground">Students will progress to Year II</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Second Year (II)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{batchStats.toBePromotedToIII}</div>
                  <p className="text-sm text-muted-foreground">Students will progress to Year III</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Third Year (III)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{batchStats.toBeGraduated}</div>
                  <p className="text-sm text-muted-foreground">Students will be marked as passed out</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progression Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click the button below to preview the batch progression changes before confirming.
                  </p>
                  <div className="flex gap-4">
                    <Button onClick={handlePreviewProgression} disabled={batchStats.toBePromotedToII === 0 && batchStats.toBePromotedToIII === 0 && batchStats.toBeGraduated === 0}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Preview & Execute Progression
                    </Button>

                    {progressionHistory.length > 0 && (
                      <Button variant="outline" onClick={() => {
                        if (confirm("Are you sure you want to rollback the last progression?")) {
                          handleRollbackProgression(progressionHistory[0].id)
                        }
                      }}>
                        <Undo2 className="h-4 w-4 mr-2" />
                        Undo Last Progression
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archived" className="space-y-6">
            {getArchivedBatchesByYear().length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <p className="text-sm text-muted-foreground text-center">No archived batches yet</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {getArchivedBatchesByYear().map((batch) => (
                  <AccordionItem key={batch.year} value={batch.year.toString()} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                          <div className="text-xl font-semibold">{batch.year} Passed Out Batch</div>
                          <p className="text-sm text-muted-foreground font-normal mt-1">
                            {batch.count} student{batch.count !== 1 ? "s" : ""} completed their program
                          </p>
                        </div>
                        <div className="text-3xl font-bold text-primary mr-4">{batch.count}</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-4">

                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                              <th className="text-left py-3 px-4 font-medium text-sm">Roll Number</th>
                              <th className="text-left py-3 px-4 font-medium text-sm">Department</th>
                              <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batch.students.map((student: any, index: number) => (
                              <tr key={index} className="border-t">
                                <td className="py-3 px-4 text-sm">{student.name}</td>
                                <td className="py-3 px-4 text-sm">{student.rollNumber}</td>
                                <td className="py-3 px-4 text-sm">{student.department}</td>
                                <td className="py-3 px-4 text-sm text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/hod/students/${student.id}`)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progression History</CardTitle>
              </CardHeader>
              <CardContent>
                {progressionHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No progression history yet</p>
                ) : (
                  <div className="space-y-4">
                    {progressionHistory.map((progression: any) => (
                      <Card key={progression.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium">
                                  {progression.academicYear} Batch Progression
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(progression.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Promoted: {progression.promotedCount} students</p>
                                <p>Graduated: {progression.graduatedCount} students</p>
                                {progression.description && (
                                  <p className="italic">"{progression.description}"</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {/* Only allow rollback of the MOST RECENT progression? 
                                  For now, we just show button, backend handles safety or not.
                                  Ideally we sort by date and only show on top one.
                              */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to rollback this progression? This will restore all students to their previous state.",
                                    )
                                  ) {
                                    handleRollbackProgression(progression.id)
                                  }
                                }}
                              >
                                <Undo2 className="h-4 w-4 mr-2" />
                                Rollback
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Batch Progression</DialogTitle>
            </DialogHeader>
            {progressionPreview && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Year III students to be passed out:</span>
                    <span className="font-semibold">{progressionPreview.toBePassedOut}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Year II → Year III:</span>
                    <span className="font-semibold">{progressionPreview.iiToIII}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Year I → Year II:</span>
                    <span className="font-semibold">{progressionPreview.iToII}</span>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You can rollback this action from the Progression History tab if needed.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmProgression}>Confirm Progression</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  )
}
