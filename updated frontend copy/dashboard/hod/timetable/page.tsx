"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Save, Settings, Clock, Plus, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Faculty = {
    id: string
    name: string
    department?: string
}

type TimeSlot = {
    id: string
    startTime: string
    endTime: string
    type: "class" | "break"
    periodNumber?: number
}

type TimetableEntry = {
    subject: string
    facultyId: string
    facultyName: string
}

// Structure: { [year]: { [day]: { [periodIndex]: TimetableEntry } } }
type TimetableData = Record<string, Record<string, Record<number, TimetableEntry>>>

type TimetableSettings = {
    startTime: string
    periodDuration: number // minutes
    periodsPerDay: number
    breakAfterPeriod: number
    breakDuration: number // minutes
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const YEARS = ["I", "II", "III"] as const

export default function TimetablePage() {
    const router = useRouter()
    const { toast } = useToast()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<any>(null)

    const [selectedYear, setSelectedYear] = useState<string>("I")
    const [facultyList, setFacultyList] = useState<Faculty[]>([])
    const [timetable, setTimetable] = useState<TimetableData>({})
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const [viewMode, setViewMode] = useState<"class" | "faculty">("class")
    const [selectedFacultyForView, setSelectedFacultyForView] = useState<string>("")

    // Default settings based on request
    // 8:30 start, 55 min period, break after 2 periods (10:20), 25 min break, 5 periods total
    const [settings, setSettings] = useState<TimetableSettings>({
        startTime: "08:30",
        periodDuration: 55,
        periodsPerDay: 5,
        breakAfterPeriod: 2,
        breakDuration: 25
    })

    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        const userData = session?.user
        if (!userData) return

        if (userData.role?.toLowerCase() !== "hod") {
            router.push(`/dashboard/${userData.role?.toLowerCase()}`)
            return
        }

        setUser(userData)
    }, [session, status, router])

    // Load data on mount
    useEffect(() => {
        // Load faculty
        try {
            const storedFaculty = JSON.parse(localStorage.getItem("faculty") || "[]")
            // Also include HOD/Admins if needed, but primary is faculty list
            const facultyUsers = JSON.parse(localStorage.getItem("facultyLogins") || "{}")
            const combinedFaculty: Faculty[] = [...storedFaculty]

            // If "faculty" list is empty, try to populate from logins or use mock
            if (combinedFaculty.length === 0) {
                // Fallback mock data if completely empty
                combinedFaculty.push(
                    { id: "f1", name: "Dr. Smith", department: "CSE" },
                    { id: "f2", name: "Prof. Johnson", department: "CSE" },
                    { id: "f3", name: "Mrs. Davis", department: "Math" }
                )
            }
            setFacultyList(combinedFaculty)

            // Load Settings
            const storedSettings = localStorage.getItem("timetable_settings")
            if (storedSettings) {
                setSettings(JSON.parse(storedSettings))
            }

            // Load Timetable
            const storedTimetable = localStorage.getItem("timetable_data")
            if (storedTimetable) {
                setTimetable(JSON.parse(storedTimetable))
            } else {
                // Initialize empty structure
                const initial: TimetableData = { I: {}, II: {}, III: {} }
                YEARS.forEach(year => {
                    DAYS.forEach(day => {
                        initial[year][day] = {}
                    })
                })
                setTimetable(initial)
            }

        } catch (e) {
            console.error("Failed to load data", e)
        }
    }, [])

    const saveSettings = () => {
        localStorage.setItem("timetable_settings", JSON.stringify(settings))
        setIsSettingsOpen(false)
        toast({ title: "Settings Saved", description: "Timetable configuration updated." })
    }

    const handleEntryChange = (day: string, periodIndex: number, field: "subject" | "facultyId" | "facultyName", value: string) => {
        const currentYearData = timetable[selectedYear] || {}
        const currentDayData = currentYearData[day] || {}
        const currentEntry = currentDayData[periodIndex] || { subject: "", facultyId: "", facultyName: "" }

        let newEntry = { ...currentEntry }

        if (field === "facultyId") {
            if (value === "_manual") {
                newEntry.facultyId = "_manual"
                newEntry.facultyName = "" // Reset name for manual entry
            } else {
                const faculty = facultyList.find(f => f.id === value)
                newEntry.facultyId = value
                newEntry.facultyName = faculty ? faculty.name : ""
            }
        } else if (field === "facultyName") {
            newEntry.facultyName = value
        } else {
            newEntry.subject = value
        }

        const newTimetable = {
            ...timetable,
            [selectedYear]: {
                ...timetable[selectedYear],
                [day]: {
                    ...(timetable[selectedYear]?.[day] || {}),
                    [periodIndex]: newEntry
                }
            }
        }

        setTimetable(newTimetable)
        localStorage.setItem("timetable_data", JSON.stringify(newTimetable))
    }

    // Helper to generate time slots based on settings
    const generateTimeSlots = (): TimeSlot[] => {
        const slots: TimeSlot[] = []
        let currentTime = new Date(`2000-01-01T${settings.startTime}`)
        let periodCount = 0

        // Safety limit to prevent infinite loops if bad settings
        const maxSlots = 20

        while (periodCount < settings.periodsPerDay && slots.length < maxSlots) {
            periodCount++

            // Start of period
            const startStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

            // Add period duration
            currentTime.setMinutes(currentTime.getMinutes() + settings.periodDuration)
            const endStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

            slots.push({
                id: `p-${periodCount}`,
                startTime: startStr,
                endTime: endStr,
                type: "class",
                periodNumber: periodCount
            })

            // Check for break
            if (periodCount === settings.breakAfterPeriod) {
                const breakStart = endStr
                currentTime.setMinutes(currentTime.getMinutes() + settings.breakDuration)
                const breakEnd = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

                slots.push({
                    id: `break`,
                    startTime: breakStart,
                    endTime: breakEnd,
                    type: "break"
                })
            }
        }
        return slots
    }

    const timeSlots = generateTimeSlots()

    // Helper: Find where a faculty is assigned at a specific slot
    const findFacultyAssignment = (facultyId: string, day: string, periodIdx: number) => {
        for (const year in timetable) {
            const entry = timetable[year]?.[day]?.[periodIdx]
            if (entry && (entry.facultyId === facultyId || (entry.facultyId === "_manual" && entry.facultyName === facultyList.find(f => f.id === facultyId)?.name))) {
                return { year, subject: entry.subject }
            }
        }
        return null
    }

    const handleFacultyAssignmentChange = (facultyId: string, facultyName: string, day: string, periodIdx: number, field: "year" | "subject" | "className", value: string) => {
        const currentAssignment = findFacultyAssignment(facultyId, day, periodIdx)
        const newTimetable = JSON.parse(JSON.stringify(timetable)) as TimetableData

        if (field === "year" || field === "className") {
            const newYear = value
            const subject = currentAssignment ? currentAssignment.subject : ""

            if (currentAssignment) {
                const oldYearData = newTimetable[currentAssignment.year] || {}
                const oldDayData = oldYearData[day] || {}
                oldDayData[periodIdx] = { subject: "", facultyId: "", facultyName: "" }
            }

            if (newYear && newYear !== "none") {
                if (!newTimetable[newYear]) newTimetable[newYear] = {}
                if (!newTimetable[newYear][day]) newTimetable[newYear][day] = {}

                newTimetable[newYear][day][periodIdx] = {
                    subject: subject,
                    facultyId: facultyId,
                    facultyName: facultyName
                }
            }
        }
        else if (field === "subject") {
            if (currentAssignment) {
                const year = currentAssignment.year
                if (newTimetable[year]?.[day]?.[periodIdx]) {
                    newTimetable[year][day][periodIdx].subject = value
                }
            }
        }

        setTimetable(newTimetable)
        localStorage.setItem("timetable_data", JSON.stringify(newTimetable))
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-xl font-semibold">Timetable Management</h1>
                        </div>
                        <div className="flex gap-2 items-center">
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "class" | "faculty")} className="mr-4">
                                <TabsList>
                                    <TabsTrigger value="class">Class View</TabsTrigger>
                                    <TabsTrigger value="faculty">Faculty View</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Settings
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Timetable Configuration</DialogTitle>
                                        <CardDescription>Customize global timing settings for all years.</CardDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        {/* Settings Inputs maintained... */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={settings.startTime}
                                                    onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Period Duration (mins)</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.periodDuration}
                                                    onChange={(e) => setSettings({ ...settings, periodDuration: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Periods Per Day</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.periodsPerDay}
                                                    onChange={(e) => setSettings({ ...settings, periodsPerDay: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Break After Period</Label>
                                                <Input
                                                    type="number"
                                                    value={settings.breakAfterPeriod}
                                                    onChange={(e) => setSettings({ ...settings, breakAfterPeriod: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Break Duration (mins)</Label>
                                            <Input
                                                type="number"
                                                value={settings.breakDuration}
                                                onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={saveSettings}>Save Changes</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {viewMode === "class" ? (
                    <Tabs value={selectedYear} onValueChange={setSelectedYear} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                {YEARS.map(year => (
                                    <TabsTrigger key={year} value={year} className="w-32">
                                        Year {year}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Total: {settings.periodsPerDay} Periods | Break after period {settings.breakAfterPeriod}</span>
                            </div>
                        </div>

                        {YEARS.map(year => (
                            <TabsContent key={year} value={year} className="space-y-6">
                                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border rounded-xl shadow-sm bg-card custom-scrollbar">
                                    <table className="w-full text-sm text-left border-separate border-spacing-0">
                                        <thead className="bg-muted text-xs uppercase sticky top-0 z-30">
                                            <tr>
                                                <th className="px-6 py-4 font-medium sticky left-0 top-0 bg-secondary z-40 w-40 border-r border-b shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.1)]">
                                                    Day / Time
                                                </th>
                                                {timeSlots.map(slot => (
                                                    <th key={slot.id} className={`px-6 py-4 font-medium text-center border-l border-b min-w-[200px] ${slot.type === 'break' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-400' : ''}`}>
                                                        <div className="flex flex-col gap-1">
                                                            <span>{slot.type === 'class' ? `Period ${slot.periodNumber}` : 'BREAK'}</span>
                                                            <span className="text-[10px] text-muted-foreground font-normal bg-background/50 px-2 py-0.5 rounded-full w-fit mx-auto border">
                                                                {slot.startTime} - {slot.endTime}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {DAYS.map(day => (
                                                <tr key={day} className="transition-colors">
                                                    <td className="px-6 py-4 font-medium sticky left-0 bg-card z-10 border-r border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{day}</td>
                                                    {timeSlots.map((slot, index) => {
                                                        if (slot.type === 'break') {
                                                            return (
                                                                <td key={slot.id} className="px-6 py-4 bg-orange-50 dark:bg-orange-900 border-l text-center text-muted-foreground font-medium text-xs tracking-widest relative">
                                                                    <div className="absolute inset-y-2 left-1/2 w-0.5 bg-orange-200 -translate-x-1/2"></div>
                                                                    <span className="relative bg-background px-2 text-orange-300">BREAK</span>
                                                                </td>
                                                            )
                                                        }

                                                        const periodIdx = slot.periodNumber || 0
                                                        const entry = timetable[year]?.[day]?.[periodIdx] || { subject: "", facultyName: "" }
                                                        const isManual = entry.facultyId === "_manual"

                                                        return (
                                                            <td key={slot.id} className="px-4 py-3 border-l align-top">
                                                                <div className="space-y-2 group">
                                                                    <Input
                                                                        placeholder="Subject Name"
                                                                        className="h-8 text-xs font-medium border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all placeholder:text-muted-foreground/50"
                                                                        value={entry.subject}
                                                                        onChange={(e) => handleEntryChange(day, periodIdx, "subject", e.target.value)}
                                                                    />

                                                                    {isManual ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <Input
                                                                                placeholder="Type Faculty Name"
                                                                                className="h-7 text-xs border-transparent bg-muted/40 hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all placeholder:text-muted-foreground/50 w-full"
                                                                                value={entry.facultyName}
                                                                                onChange={(e) => handleEntryChange(day, periodIdx, "facultyName", e.target.value)}
                                                                                autoFocus
                                                                            />
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                                onClick={() => handleEntryChange(day, periodIdx, "facultyId", "")}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Select
                                                                            value={entry.facultyId}
                                                                            onValueChange={(val) => handleEntryChange(day, periodIdx, "facultyId", val)}
                                                                        >
                                                                            <SelectTrigger className="h-7 text-xs border-transparent bg-muted/40 hover:bg-background hover:border-input focus:ring-0">
                                                                                <SelectValue placeholder="Select Faculty" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {facultyList.map(f => (
                                                                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                                                ))}
                                                                                <SelectItem value="_manual" className="font-medium text-primary">
                                                                                    + Other Dept / Manual...
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                ) : (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Faculty Workload</CardTitle>
                                <CardDescription>Select a faculty member to assign classes and subjects.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-md">
                                    <Label>Select Faculty</Label>
                                    <Select value={selectedFacultyForView} onValueChange={setSelectedFacultyForView}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Faculty Member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {facultyList.map(f => (
                                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {selectedFacultyForView && (
                            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border rounded-xl shadow-sm bg-card custom-scrollbar">
                                <table className="w-full text-sm text-left border-separate border-spacing-0">
                                    <thead className="bg-muted text-xs uppercase sticky top-0 z-30">
                                        <tr>
                                            <th className="px-6 py-4 font-medium sticky left-0 top-0 bg-secondary z-40 w-40 border-r border-b shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.1)]">
                                                Day / Time
                                            </th>
                                            {timeSlots.map(slot => (
                                                <th key={slot.id} className={`px-6 py-4 font-medium text-center border-l border-b min-w-[200px] ${slot.type === 'break' ? 'bg-orange-100/50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400' : ''}`}>
                                                    <div className="flex flex-col gap-1">
                                                        <span>{slot.type === 'class' ? `Period ${slot.periodNumber}` : 'BREAK'}</span>
                                                        <span className="text-[10px] text-muted-foreground font-normal bg-background/50 px-2 py-0.5 rounded-full w-fit mx-auto border">
                                                            {slot.startTime} - {slot.endTime}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {DAYS.map(day => (
                                            <tr key={day} className="transition-colors">
                                                <td className="px-6 py-4 font-medium sticky left-0 bg-card z-10 border-r border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{day}</td>
                                                {timeSlots.map((slot) => {
                                                    if (slot.type === 'break') {
                                                        return (
                                                            <td key={slot.id} className="px-6 py-4 bg-orange-50 border-l text-center text-muted-foreground font-medium text-xs tracking-widest relative">
                                                                <div className="absolute inset-y-2 left-1/2 w-0.5 bg-orange-200 -translate-x-1/2"></div>
                                                                <span className="relative bg-background px-2 text-orange-300">BREAK</span>
                                                            </td>
                                                        )
                                                    }

                                                    const periodIdx = slot.periodNumber || 0
                                                    const assignment = findFacultyAssignment(selectedFacultyForView, day, periodIdx)
                                                    const facultyObj = facultyList.find(f => f.id === selectedFacultyForView)
                                                    const facultyName = facultyObj ? facultyObj.name : ""

                                                    // Check if the assigned class is a system year or a custom one
                                                    const isSystemYear = !!(assignment && (assignment.year === "I" || assignment.year === "II" || assignment.year === "III"))
                                                    const isManual = !!(assignment && assignment.year === "_manual")

                                                    return (
                                                        <td key={slot.id} className="px-4 py-3 border-l align-top">
                                                            <div className="space-y-2">
                                                                {isManual ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            placeholder="Type Class Name"
                                                                            className="h-7 text-xs bg-muted"
                                                                            defaultValue=""
                                                                            onBlur={(e) => {
                                                                                if (e.target.value) {
                                                                                    handleFacultyAssignmentChange(selectedFacultyForView, facultyName, day, periodIdx, "className", e.target.value)
                                                                                } else {
                                                                                    handleFacultyAssignmentChange(selectedFacultyForView, facultyName, day, periodIdx, "year", "none")
                                                                                }
                                                                            }}
                                                                            autoFocus
                                                                        />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                            onClick={() => handleFacultyAssignmentChange(selectedFacultyForView, facultyName, day, periodIdx, "year", "none")}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Select
                                                                        value={assignment ? (isSystemYear ? assignment.year : "_custom") : "none"}
                                                                        onValueChange={(val) => handleFacultyAssignmentChange(selectedFacultyForView, facultyName, day, periodIdx, "year", val)}
                                                                    >
                                                                        <SelectTrigger className="h-7 text-xs bg-muted">
                                                                            <SelectValue placeholder="Select Class" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="none">Free</SelectItem>
                                                                            {YEARS.map(y => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}
                                                                            {!isSystemYear && assignment && assignment.year !== "none" && (
                                                                                <SelectItem value="_custom">{assignment.year}</SelectItem>
                                                                            )}
                                                                            <SelectItem value="_manual" className="font-medium text-primary">
                                                                                + Other Dept / Manual...
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}

                                                                <Input
                                                                    placeholder="Subject"
                                                                    className="h-7 text-xs"
                                                                    value={assignment ? assignment.subject : ""}
                                                                    disabled={!assignment || !!isManual}
                                                                    onChange={(e) => handleFacultyAssignmentChange(selectedFacultyForView, facultyName, day, periodIdx, "subject", e.target.value)}
                                                                />
                                                            </div>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
