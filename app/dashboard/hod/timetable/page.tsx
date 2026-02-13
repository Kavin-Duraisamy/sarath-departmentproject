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
import { apiClient } from "@/lib/api"

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
    const [loading, setLoading] = useState(true)

    const [viewMode, setViewMode] = useState<"class" | "faculty">("class")
    const [selectedFacultyForView, setSelectedFacultyForView] = useState<string>("")

    // Default settings
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
        if (!userData || userData.role?.toLowerCase() !== "hod") {
            router.push("/")
            return
        }

        setUser(userData)
        fetchFaculty()
        fetchData()
    }, [session, status, router])

    const fetchFaculty = async () => {
        try {
            const response = await apiClient.getUsers()
            const facultyUsers = response.data.filter((u: any) => u.role === 'FACULTY')
            setFacultyList(facultyUsers)
        } catch (error) {
            console.error("Failed to fetch faculty", error)
        }
    }

    const fetchData = async () => {
        try {
            setLoading(true)

            // Load Settings
            const settingsRes = await apiClient.getTimetableSettings()
            if (settingsRes.data && settingsRes.data.startTime) {
                setSettings({
                    startTime: settingsRes.data.startTime,
                    periodDuration: settingsRes.data.periodDuration,
                    periodsPerDay: settingsRes.data.periodsPerDay,
                    breakAfterPeriod: settingsRes.data.breakAfterPeriod,
                    breakDuration: settingsRes.data.breakDuration
                })
            }

            // Load all entries for all years to build the complex structure
            // In a real app, maybe only load selected year, but here we keep the record structure
            const initial: TimetableData = { I: {}, II: {}, III: {} }
            YEARS.forEach(year => {
                DAYS.forEach(day => {
                    initial[year][day] = {}
                })
            })

            const entriesRes = await apiClient.getTimetableEntries()
            const dbEntries = entriesRes.data

            dbEntries.forEach((entry: any) => {
                if (initial[entry.year as keyof typeof initial]) {
                    if (!initial[entry.year as keyof typeof initial][entry.day]) {
                        initial[entry.year as keyof typeof initial][entry.day] = {}
                    }
                    initial[entry.year as keyof typeof initial][entry.day][entry.periodIndex] = {
                        subject: entry.subject,
                        facultyId: entry.facultyId || "_manual",
                        facultyName: entry.facultyName || ""
                    }
                }
            })

            setTimetable(initial)
        } catch (error) {
            console.error("Failed to fetch timetable data", error)
            toast({
                title: "Error",
                description: "Failed to load timetable data.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        try {
            await apiClient.updateTimetableSettings(settings)
            setIsSettingsOpen(false)
            toast({ title: "Settings Saved", description: "Timetable configuration updated." })
        } catch (error) {
            console.error("Failed to save settings", error)
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" })
        }
    }

    const handleEntryChange = (day: string, periodIndex: number, field: "subject" | "facultyId" | "facultyName", value: string) => {
        const currentYearData = timetable[selectedYear] || {}
        const currentDayData = currentYearData[day] || {}
        const currentEntry = currentDayData[periodIndex] || { subject: "", facultyId: "", facultyName: "" }

        let newEntry = { ...currentEntry }

        if (field === "facultyId") {
            if (value === "_manual") {
                newEntry.facultyId = "_manual"
                newEntry.facultyName = ""
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
    }

    const saveTimetable = async () => {
        try {
            const currentYearEntries = []
            const yearData = timetable[selectedYear]

            for (const day in yearData) {
                for (const periodIdx in yearData[day]) {
                    const entry = yearData[day][periodIdx]
                    if (entry.subject) {
                        currentYearEntries.push({
                            year: selectedYear,
                            day,
                            periodIndex: parseInt(periodIdx),
                            subject: entry.subject,
                            facultyId: entry.facultyId,
                            facultyName: entry.facultyName
                        })
                    }
                }
            }

            await apiClient.updateTimetableEntries({
                year: selectedYear,
                entries: currentYearEntries
            })

            toast({ title: "Timetable Saved", description: `Timetable for Year ${selectedYear} has been updated.` })
        } catch (error) {
            console.error("Failed to save timetable", error)
            toast({ title: "Error", description: "Failed to save timetable.", variant: "destructive" })
        }
    }

    // Helper to generate time slots based on settings
    const generateTimeSlots = (): TimeSlot[] => {
        const slots: TimeSlot[] = []
        let currentTime = new Date(`2000-01-01T${settings.startTime}`)
        let periodCount = 0

        const maxSlots = 20

        while (periodCount < settings.periodsPerDay && slots.length < maxSlots) {
            periodCount++

            const startStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
            currentTime.setMinutes(currentTime.getMinutes() + settings.periodDuration)
            const endStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

            slots.push({
                id: `p-${periodCount}`,
                startTime: startStr,
                endTime: endStr,
                type: "class",
                periodNumber: periodCount
            })

            if (periodCount === settings.breakAfterPeriod) {
                const bStartStr = endStr
                currentTime.setMinutes(currentTime.getMinutes() + settings.breakDuration)
                const bEndStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

                slots.push({
                    id: `b-${periodCount}`,
                    startTime: bStartStr,
                    endTime: bEndStr,
                    type: "break"
                })
            }
        }

        return slots
    }

    if (!user || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const timeSlots = generateTimeSlots()

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/hod")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-xl font-bold">Timetable Management</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Controls</CardTitle>
                                <CardDescription>Select year to manage</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Academic Year</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.map(year => (
                                                <SelectItem key={year} value={year}>Year {year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <Button className="w-full" onClick={saveTimetable}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save All Changes
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                <Settings className="h-4 w-4 mr-2" />
                                                Timetable Settings
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Timetable Configuration</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right">Start Time</Label>
                                                    <Input
                                                        type="time"
                                                        className="col-span-3"
                                                        value={settings.startTime}
                                                        onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right whitespace-nowrap">Period (min)</Label>
                                                    <Input
                                                        type="number"
                                                        className="col-span-3"
                                                        value={settings.periodDuration}
                                                        onChange={(e) => setSettings({ ...settings, periodDuration: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right whitespace-nowrap">Periods/Day</Label>
                                                    <Input
                                                        type="number"
                                                        className="col-span-3"
                                                        value={settings.periodsPerDay}
                                                        onChange={(e) => setSettings({ ...settings, periodsPerDay: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right whitespace-nowrap">Break After</Label>
                                                    <Input
                                                        type="number"
                                                        className="col-span-3"
                                                        placeholder="Period #"
                                                        value={settings.breakAfterPeriod}
                                                        onChange={(e) => setSettings({ ...settings, breakAfterPeriod: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label className="text-right whitespace-nowrap">Break (min)</Label>
                                                    <Input
                                                        type="number"
                                                        className="col-span-3"
                                                        value={settings.breakDuration}
                                                        onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={saveSettings}>Apply & Save Settings</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-3">
                        <Card className="min-h-[600px] overflow-auto">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Schedule: Year {selectedYear}</CardTitle>
                                    <CardDescription>Click slots to edit or assign faculty</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50">
                                                <th className="border p-2 text-left bg-card w-32 sticky left-0 z-10">Day / Time</th>
                                                {timeSlots.map(slot => (
                                                    <th key={slot.id} className={`border p-2 min-w-[150px] ${slot.type === 'break' ? 'bg-muted/30 w-16 min-w-[80px]' : ''}`}>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-xs text-muted-foreground">{slot.startTime}</span>
                                                            {slot.type === 'class' ? (
                                                                <span className="font-medium">Period {slot.periodNumber}</span>
                                                            ) : (
                                                                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 rounded-full uppercase">Break</span>
                                                            )}
                                                            <span className="text-xs text-muted-foreground">{slot.endTime}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {DAYS.map(day => (
                                                <tr key={day} className="hover:bg-muted/10">
                                                    <td className="border p-4 font-bold bg-card sticky left-0 z-10">{day}</td>
                                                    {timeSlots.map((slot, idx) => {
                                                        if (slot.type === 'break') {
                                                            return <td key={slot.id} className="border bg-muted/20"></td>
                                                        }

                                                        // Calculate period index (ignoring breaks)
                                                        const periodIdx = timeSlots.slice(0, idx).filter(s => s.type === 'class').length
                                                        const entry = timetable[selectedYear]?.[day]?.[periodIdx] || { subject: "", facultyId: "", facultyName: "" }

                                                        return (
                                                            <td key={slot.id} className="border p-2 group transition-colors hover:bg-muted/5">
                                                                <div className="space-y-2">
                                                                    <Input
                                                                        placeholder="Subject"
                                                                        className="h-8 text-sm focus-visible:ring-1 border-transparent hover:border-input bg-transparent"
                                                                        value={entry.subject}
                                                                        onChange={(e) => handleEntryChange(day, periodIdx, "subject", e.target.value)}
                                                                    />

                                                                    <div className="flex flex-col gap-1">
                                                                        <Select
                                                                            value={entry.facultyId || "_manual"}
                                                                            onValueChange={(val) => handleEntryChange(day, periodIdx, "facultyId", val)}
                                                                        >
                                                                            <SelectTrigger className="h-7 text-[10px] w-full border-transparent hover:border-input bg-muted/30">
                                                                                <SelectValue placeholder="Faculty" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="_manual">-- External/Manual --</SelectItem>
                                                                                {facultyList.map(f => (
                                                                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>

                                                                        {entry.facultyId === "_manual" && (
                                                                            <Input
                                                                                placeholder="Faculty Name"
                                                                                className="h-7 text-[10px] focus-visible:ring-1 border-transparent hover:border-input bg-muted/10 italic"
                                                                                value={entry.facultyName}
                                                                                onChange={(e) => handleEntryChange(day, periodIdx, "facultyName", e.target.value)}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
