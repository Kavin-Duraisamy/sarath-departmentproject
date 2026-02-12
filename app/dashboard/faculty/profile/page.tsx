"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FacultyProfilePage() {
    const router = useRouter()
    const { toast } = useToast()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<any>(null)
    const [facultyData, setFacultyData] = useState<any>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        qualification: "",
        experience: "",
        address: "",
        emergencyContact: "",
    })

    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        const userData = session?.user
        if (!userData || userData.role !== "faculty") {
            router.push("/")
            return
        }

        setUser(userData)

        // Load faculty data
        const allFaculty = JSON.parse(localStorage.getItem("faculty") || "[]")
        const faculty = allFaculty.find((f: any) => f.username === userData.email || f.email === userData.email)

        if (faculty) {
            setFacultyData(faculty)
            setFormData({
                name: faculty.name || "",
                email: faculty.email || "",
                phone: faculty.phone || "",
                department: faculty.department || "",
                designation: faculty.designation || "Assistant Professor",
                qualification: faculty.qualification || "",
                experience: faculty.experience || "",
                address: faculty.address || "",
                emergencyContact: faculty.emergencyContact || "",
            })
        }
    }, [session, status, router])

    const handleSave = () => {
        const allFaculty = JSON.parse(localStorage.getItem("faculty") || "[]")
        const updatedFaculty = allFaculty.map((f: any) =>
            f.id === facultyData.id
                ? { ...f, ...formData }
                : f
        )

        localStorage.setItem("faculty", JSON.stringify(updatedFaculty))
        setFacultyData({ ...facultyData, ...formData })
        setIsEditing(false)

        toast({
            title: "Profile Updated",
            description: "Your profile has been updated successfully",
        })
    }

    if (!user || !facultyData) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/faculty")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-semibold">My Profile</h2>
                        <p className="text-muted-foreground">View and manage your information</p>
                    </div>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm">{formData.name}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                {isEditing ? (
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm">{formData.email}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm">{formData.phone}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Emergency Contact</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm">{formData.emergencyContact || "Not provided"}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Address</Label>
                            {isEditing ? (
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            ) : (
                                <p className="text-sm">{formData.address || "Not provided"}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Professional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <p className="text-sm">{formData.department}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Designation</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm">{formData.designation}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Highest Qualification</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                        placeholder="e.g., M.Sc, Ph.D"
                                    />
                                ) : (
                                    <p className="text-sm">{formData.qualification || "Not provided"}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Years of Experience</Label>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        value={formData.experience}
                                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm">{formData.experience || "Not provided"}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Assigned Subjects</Label>
                            <div className="flex flex-wrap gap-2">
                                {facultyData.subjects?.map((subject: string) => (
                                    <Badge key={subject} variant="secondary">{subject}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Assigned Years</Label>
                            <div className="flex gap-2">
                                {facultyData.assignedYears?.map((year: string) => (
                                    <Badge key={year}>Year {year}</Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Login Credentials</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Username</Label>
                            <p className="text-sm">{facultyData.username}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Button variant="outline" size="sm">
                                Change Password
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
