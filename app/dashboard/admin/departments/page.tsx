"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, LogOut, Building2, Plus, Search, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface Department {
    id: string
    name: string
    code: string
    studentCount: number
    facultyCount: number
    hodName: string
}

export default function DepartmentsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<any>(null)
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newDept, setNewDept] = useState({ name: "", code: "" })

    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        const userData = session?.user
        if (!userData || userData.role !== "admin") {
            if (userData?.role) router.push(`/dashboard/${userData.role}`)
            else router.push("/")
            return
        }

        setUser(userData)
        fetchDepartments()
    }, [session, status, router])

    const fetchDepartments = async () => {
        try {
            setLoading(true)
            const res = await apiClient.getDepartments()
            setDepartments(res.data)
        } catch (error) {
            console.error("Failed to fetch departments", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddDepartment = async () => {
        if (!newDept.name || !newDept.code) {
            toast({ title: "Error", description: "Name and Code are required", variant: "destructive" })
            return
        }

        try {
            await apiClient.createDepartment(newDept)
            toast({ title: "Success", description: "Department created successfully" })
            setNewDept({ name: "", code: "" })
            setShowAddForm(false)
            fetchDepartments()
        } catch (error) {
            toast({ title: "Error", description: "Failed to create department", variant: "destructive" })
        }
    }

    const handleDeleteDepartment = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This will affect all associated records.`)) return

        try {
            await apiClient.deleteDepartment(id)
            toast({ title: "Success", description: "Department deleted successfully" })
            fetchDepartments()
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete department", variant: "destructive" })
        }
    }

    const handleLogout = () => {
        signOut({ callbackUrl: "/" })
    }

    if (!user) {
        return null
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
                                <h1 className="text-2xl font-semibold">Department Management</h1>
                                <p className="text-sm text-muted-foreground">Manage organizational structure and credentials</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setShowAddForm(!showAddForm)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Department
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {showAddForm && (
                    <Card className="mb-8 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg">Register New Department</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Department Name (e.g., Computer Science)</Label>
                                    <Input
                                        value={newDept.name}
                                        onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department Code (e.g., CSE)</Label>
                                    <Input
                                        value={newDept.code}
                                        onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                                        placeholder="Abbreviation"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button onClick={handleAddDepartment}>Save Department</Button>
                                <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : departments.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground italic">
                            No departments registered yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {departments.map((dept) => (
                            <Card
                                key={dept.id}
                                className="group hover:shadow-lg transition-all border-l-4 border-l-primary/30"
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            {dept.name}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteDepartment(dept.id, dept.name);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 my-4">
                                        <div className="bg-muted/40 p-3 rounded-lg text-center">
                                            <div className="text-2xl font-bold">{dept.studentCount}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Students</div>
                                        </div>
                                        <div className="bg-muted/40 p-3 rounded-lg text-center">
                                            <div className="text-2xl font-bold">{dept.facultyCount}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Faculty</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs flex justify-between">
                                            <span className="text-muted-foreground font-medium">HOD:</span>
                                            <span className="font-semibold text-primary">{dept.hodName}</span>
                                        </div>
                                        <div className="text-xs flex justify-between">
                                            <span className="text-muted-foreground font-medium">Code:</span>
                                            <span className="font-mono bg-muted px-1 rounded">{dept.code}</span>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                                        onClick={() => router.push(`/dashboard/admin/departments/${encodeURIComponent(dept.name)}`)}
                                    >
                                        View Credentials
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
