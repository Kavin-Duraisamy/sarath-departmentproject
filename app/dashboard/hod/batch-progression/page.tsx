"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowLeft, RefreshCw, AlertCircle, Undo2, FastForward, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BatchProgressionPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [batchStats, setBatchStats] = useState({
    yearI: 0,
    yearII: 0,
    yearIII: 0,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [progressionPreview, setProgressionPreview] = useState<any>(null)
  const [archivedStudents, setArchivedStudents] = useState<any[]>([])
  const [progressionHistory, setProgressionHistory] = useState<any[]>([])
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false)
  const [isReprogressDialogOpen, setIsReprogressDialogOpen] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<any>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "hod") {
      if (userData) {
        router.push(`/dashboard/${userData.role}`)
      } else {
        router.push("/")
      }
      return
    }

    setUser(userData)
    loadBatchStats()
    loadArchivedStudents()
    loadProgressionHistory()
  }, [session, status, router])

  const loadBatchStats = () => {
    const students = JSON.parse(localStorage.getItem("students") || "[]")
    setBatchStats({
      yearI: students.filter((s: any) => s.year === "I").length,
      yearII: students.filter((s: any) => s.year === "II").length,
      yearIII: students.filter((s: any) => s.year === "III").length,
    })
  }

  const loadArchivedStudents = () => {
    const archived = JSON.parse(localStorage.getItem("archived_students") || "[]")
    setArchivedStudents(archived)
  }

  const loadProgressionHistory = () => {
    const history = JSON.parse(localStorage.getItem("progression_history") || "[]")
    setProgressionHistory(history)
  }

  const getArchivedBatchesByYear = () => {
    const grouped: { [year: number]: any[] } = {}
    archivedStudents.forEach((student: any) => {
      const year = student.passedOutYear || new Date(student.archivedDate).getFullYear()
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
    const students = JSON.parse(localStorage.getItem("students") || "[]")

    const yearIStudents = students.filter((s: any) => s.year === "I")
    const yearIIStudents = students.filter((s: any) => s.year === "II")
    const yearIIIStudents = students.filter((s: any) => s.year === "III")

    setProgressionPreview({
      toBePassedOut: yearIIIStudents.length,
      iToII: yearIStudents.length,
      iiToIII: yearIIStudents.length,
      newFirstYear: 0,
    })

    setIsDialogOpen(true)
  }

  const handleConfirmProgression = () => {
    const students = JSON.parse(localStorage.getItem("students") || "[]")
    const passedOutYear = new Date().getFullYear() + 1

    const progressionSnapshot = {
      id: Date.now(),
      date: new Date().toISOString(),
      beforeProgression: JSON.parse(JSON.stringify(students)),
      stats: {
        yearI: students.filter((s: any) => s.year === "I").length,
        yearII: students.filter((s: any) => s.year === "II").length,
        yearIII: students.filter((s: any) => s.year === "III").length,
      },
      passedOutYear,
    }

    const updatedStudents = students
      .map((student: any) => {
        if (student.year === "I") {
          return { ...student, year: "II" }
        } else if (student.year === "II") {
          return { ...student, year: "III" }
        } else if (student.year === "III") {
          return null
        }
        return student
      })
      .filter(Boolean)

    updatedStudents.forEach((student: any) => {
      if (student.year === "III") {
        const projectsData = JSON.parse(localStorage.getItem(`student_projects_${student.id}`) || "{}")
        if (projectsData.final) {
          projectsData.final = { title: "", description: "", technologies: "", guide: "" }
          localStorage.setItem(`student_projects_${student.id}`, JSON.stringify(projectsData))
        }
      }
    })

    localStorage.setItem("students", JSON.stringify(updatedStudents))

    const passedOutStudents = students.filter((s: any) => s.year === "III")
    const archived = JSON.parse(localStorage.getItem("archived_students") || "[]")
    const archivedWithMetadata = passedOutStudents.map((s: any) => ({
      ...s,
      archivedDate: new Date().toISOString(),
      progressionId: progressionSnapshot.id,
      passedOutYear,
    }))
    localStorage.setItem("archived_students", JSON.stringify([...archived, ...archivedWithMetadata]))

    const history = JSON.parse(localStorage.getItem("progression_history") || "[]")
    localStorage.setItem("progression_history", JSON.stringify([progressionSnapshot, ...history]))

    setIsDialogOpen(false)
    loadBatchStats()
    loadArchivedStudents()
    loadProgressionHistory()

    alert("Batch progression completed successfully!")
  }

  const handleRollbackProgression = (progressionId: number) => {
    const history = progressionHistory.find((p: any) => p.id === progressionId)
    if (!history) {
      alert("Progression not found")
      return
    }

    localStorage.setItem("students", JSON.stringify(history.beforeProgression))

    const archived = JSON.parse(localStorage.getItem("archived_students") || "[]")
    const filteredArchived = archived.filter((s: any) => s.progressionId !== progressionId)
    localStorage.setItem("archived_students", JSON.stringify(filteredArchived))

    const updatedHistory = progressionHistory.filter((p: any) => p.id !== progressionId)
    localStorage.setItem("progression_history", JSON.stringify(updatedHistory))

    loadBatchStats()
    loadArchivedStudents()
    loadProgressionHistory()

    alert("Progression has been rolled back successfully!")
  }

  const handleUndoProgression = () => {
    if (progressionHistory.length === 0) {
      alert("No progression history to undo")
      return
    }

    const lastProgression = progressionHistory[0]
    handleRollbackProgression(lastProgression.id)
    setIsUndoDialogOpen(false)
  }

  const handleReprogressBatch = (progression: any) => {
    setSelectedHistory(progression)
    setIsReprogressDialogOpen(true)
  }

  const handleConfirmReprogress = () => {
    if (!selectedHistory) return

    const students = JSON.parse(JSON.stringify(selectedHistory.beforeProgression))
    const passedOutYear = new Date().getFullYear() + 1

    const progressionSnapshot = {
      id: Date.now(),
      date: new Date().toISOString(),
      beforeProgression: students,
      stats: {
        yearI: students.filter((s: any) => s.year === "I").length,
        yearII: students.filter((s: any) => s.year === "II").length,
        yearIII: students.filter((s: any) => s.year === "III").length,
      },
      reprocessedFrom: selectedHistory.id,
      passedOutYear,
    }

    const updatedStudents = students
      .map((student: any) => {
        if (student.year === "I") {
          return { ...student, year: "II" }
        } else if (student.year === "II") {
          return { ...student, year: "III" }
        } else if (student.year === "III") {
          return null
        }
        return student
      })
      .filter(Boolean)

    updatedStudents.forEach((student: any) => {
      if (student.year === "III") {
        const projectsData = JSON.parse(localStorage.getItem(`student_projects_${student.id}`) || "{}")
        if (projectsData.final) {
          projectsData.final = { title: "", description: "", technologies: "", guide: "" }
          localStorage.setItem(`student_projects_${student.id}`, JSON.stringify(projectsData))
        }
      }
    })

    localStorage.setItem("students", JSON.stringify(updatedStudents))

    const passedOutStudents = students.filter((s: any) => s.year === "III")
    const archived = JSON.parse(localStorage.getItem("archived_students") || "[]")
    const archivedWithMetadata = passedOutStudents.map((s: any) => ({
      ...s,
      archivedDate: new Date().toISOString(),
      progressionId: progressionSnapshot.id,
      reprocessed: true,
      passedOutYear,
    }))
    localStorage.setItem("archived_students", JSON.stringify([...archived, ...archivedWithMetadata]))

    const history = JSON.parse(localStorage.getItem("progression_history") || "[]")
    localStorage.setItem("progression_history", JSON.stringify([progressionSnapshot, ...history]))

    setIsReprogressDialogOpen(false)
    setSelectedHistory(null)
    loadBatchStats()
    loadArchivedStudents()
    loadProgressionHistory()

    alert("Batch reprogressed successfully!")
  }

  if (!user) {
    return null
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
                This action will progress all students to the next year, mark Year III students as passed out, and clear
                final year project fields for new final year students.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">First Year (I)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{batchStats.yearI}</div>
                  <p className="text-sm text-muted-foreground">Students will progress to Year II</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Second Year (II)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{batchStats.yearII}</div>
                  <p className="text-sm text-muted-foreground">Students will progress to Year III</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Third Year (III)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{batchStats.yearIII}</div>
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
                    <Button onClick={handlePreviewProgression}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Preview Batch Progression
                    </Button>
                    {progressionHistory.length > 0 && (
                      <Button variant="outline" onClick={() => setIsUndoDialogOpen(true)}>
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
                      <div className="flex justify-end mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent accordion toggle when clicking button
                            const progression = progressionHistory.find((p: any) => p.passedOutYear === batch.year)
                            if (progression) {
                              if (
                                confirm(
                                  `Are you sure you want to rollback the ${batch.year} batch progression? This will restore all students.`,
                                )
                              ) {
                                handleRollbackProgression(progression.id)
                              }
                            }
                          }}
                        >
                          <Undo2 className="h-4 w-4 mr-2" />
                          Rollback Batch
                        </Button>
                      </div>
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                              <th className="text-left py-3 px-4 font-medium text-sm">Roll Number</th>
                              <th className="text-left py-3 px-4 font-medium text-sm">Department</th>
                              <th className="text-left py-3 px-4 font-medium text-sm">Archived Date</th>
                              <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {batch.students.map((student: any, index: number) => (
                              <tr key={index} className="border-t">
                                <td className="py-3 px-4 text-sm">{student.name}</td>
                                <td className="py-3 px-4 text-sm">{student.rollNumber}</td>
                                <td className="py-3 px-4 text-sm">{student.department}</td>
                                <td className="py-3 px-4 text-sm">
                                  {student.archivedDate ? new Date(student.archivedDate).toLocaleDateString() : "N/A"}
                                </td>
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
                                  {progression.passedOutYear && `${progression.passedOutYear} Batch - `}
                                  Progression on {new Date(progression.date).toLocaleDateString()} at{" "}
                                  {new Date(progression.date).toLocaleTimeString()}
                                </p>
                                {progression.reprocessedFrom && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Reprocessed
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Year I: {progression.stats.yearI} students → Year II</p>
                                <p>Year II: {progression.stats.yearII} students → Year III</p>
                                <p>Year III: {progression.stats.yearIII} students → Passed Out</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReprogressBatch(progression)}
                                title="Reprogress this batch"
                              >
                                <FastForward className="h-4 w-4 mr-2" />
                                Reprogress
                              </Button>
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

        <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Undo Batch Progression</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will restore all students to their previous year and restore archived students. This action
                  cannot be undone.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUndoDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUndoProgression}>Confirm Undo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isReprogressDialogOpen} onOpenChange={setIsReprogressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reprogress Batch</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will restore students to their state at the time of this progression and progress them again.
                  This creates a new progression entry.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReprogressDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmReprogress}>Confirm Reprogress</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
