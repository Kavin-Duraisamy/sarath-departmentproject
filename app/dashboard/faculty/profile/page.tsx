"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    ArrowLeft,
    Edit,
    Save,
    X,
    User as UserIcon,
    Mail,
    Phone,
    Building2,
    GraduationCap,
    Briefcase,
    MapPin,
    PhoneCall,
    Clock,
    ShieldCheck,
    CheckCircle2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { apiClient } from "@/lib/api"

export default function FacultyProfilePage() {
    const router = useRouter()
    const { toast } = useToast()
    const { data: session, status } = useSession()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        designation: "",
        qualification: "",
        experience: "",
        address: "",
        emergencyContact: "",
    })

    const fetchProfile = async () => {
        try {
            setLoading(true)
            const res = await apiClient.getCurrentUser()
            const userData = res.data
            setUser(userData)
            setFormData({
                name: userData.name || "",
                email: userData.email || "",
                phone: userData.phone || "",
                designation: userData.designation || "",
                qualification: userData.qualification || "",
                experience: userData.experience || "",
                address: userData.address || "",
                emergencyContact: userData.emergencyContact || "",
            })
        } catch (error) {
            console.error("Error fetching profile:", error)
            toast({
                title: "Error",
                description: "Failed to load profile data",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        if (session?.user?.role?.toLowerCase() !== "faculty") {
            router.push("/")
            return
        }

        fetchProfile()
    }, [session, status, router])

    const handleSave = async () => {
        try {
            setLoading(true)
            await apiClient.updateUser(user.id, formData)
            toast({
                title: "Success",
                description: "Profile updated successfully",
            })
            setIsEditing(false)
            fetchProfile() // Refresh data
        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update profile",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Glassmorphic Header */}
            <div className="relative h-64 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),transparent)]"></div>
                <div className="container mx-auto px-4 pt-8 h-full flex flex-col justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit text-white hover:bg-white/10"
                        onClick={() => router.push("/dashboard/faculty")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="flex flex-col md:flex-row items-center gap-6 pb-8 translate-y-12">
                        <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-2xl">
                            <div className="w-full h-full rounded-[1.4rem] bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center border border-gray-100 uppercase text-4xl font-bold text-primary/40">
                                {user.name?.split(" ").map((n: string) => n[0]).join("")}
                            </div>
                        </div>
                        <div className="text-center md:text-left space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-white tracking-tight">{user.name}</h1>
                                <Badge variant="secondary" className="bg-white/20 text-white border-transparent backdrop-blur-md uppercase text-[10px] tracking-widest px-2.5 py-0.5">
                                    {user.role}
                                </Badge>
                            </div>
                            <p className="text-blue-50/80 font-medium flex items-center justify-center md:justify-start gap-2">
                                <Building2 className="h-4 w-4" />
                                {user.department || "No Department Assigned"}
                            </p>
                        </div>
                        <div className="md:ml-auto mb-1 flex gap-2">
                            {!isEditing ? (
                                <Button size="lg" className="rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button size="lg" variant="outline" className="rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => setIsEditing(false)}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button size="lg" className="rounded-2xl shadow-xl shadow-primary/20 bg-green-500 hover:bg-green-600 border-none px-8" onClick={handleSave} disabled={loading}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 pt-20 pb-12 max-w-6xl">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left Column - Contact & Identity */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-bold">Email Address</Label>
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        {isEditing ? (
                                            <Input
                                                className="h-9 rounded-xl border-gray-200 focus:ring-primary/20 transition-all"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-sm font-medium">{user.email}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-bold">Phone Number</Label>
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        {isEditing ? (
                                            <Input
                                                className="h-9 rounded-xl border-gray-200 focus:ring-primary/20 transition-all"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-sm font-medium">{user.phone || "Not provided"}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-bold">Residential Address</Label>
                                    <div className="flex items-start gap-3 group">
                                        <div className="w-8 h-8 mt-1 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        {isEditing ? (
                                            <Textarea
                                                className="rounded-xl border-gray-200 focus:ring-primary/20 transition-all min-h-[80px]"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-sm font-medium leading-relaxed">{user.address || "No address provided"}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-bold">Emergency Contact</Label>
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                                            <PhoneCall className="h-4 w-4" />
                                        </div>
                                        {isEditing ? (
                                            <Input
                                                className="h-9 rounded-xl border-gray-200 focus:ring-primary/20 transition-all"
                                                value={formData.emergencyContact}
                                                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                            />
                                        ) : (
                                            <span className="text-sm font-medium">{user.emergencyContact || "Not provided"}</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary/5 border border-primary/10">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Account Username</p>
                                    <p className="text-sm font-mono font-bold text-primary">{user.username}</p>
                                </div>
                                <Button variant="outline" className="w-full rounded-xl bg-white hover:bg-white/90 border-primary/20 text-primary">
                                    Change Password
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Professional & Training */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Professional Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Designation", value: user.designation || "Faculty", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                                { label: "Experience", value: `${user.experience || 0} Years`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
                                { label: "Department", value: user.department?.split(" ")[0] || "General", icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
                                { label: "Verification", value: "Verified", icon: ShieldCheck, color: "text-orange-600", bg: "bg-orange-50" },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
                                    <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                        <stat.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{stat.label}</p>
                                        <p className="text-sm font-bold truncate">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Educational Background */}
                        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                    Professional Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Highest Qualification</Label>
                                        {isEditing ? (
                                            <Input
                                                className="rounded-xl"
                                                value={formData.qualification}
                                                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                                placeholder="e.g. Ph.D in Computer Science"
                                            />
                                        ) : (
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 font-medium text-sm">
                                                {user.qualification || "No qualification listed"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Institutional Designation</Label>
                                        {isEditing ? (
                                            <Input
                                                className="rounded-xl"
                                                value={formData.designation}
                                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                            />
                                        ) : (
                                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 font-medium text-sm">
                                                {user.designation || "Assistant Professor"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-muted-foreground">Academic Focus (Applied Years)</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {user.assignedYears?.length > 0 ? (
                                            user.assignedYears.map((year: string) => (
                                                <div key={year} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 text-primary text-sm font-bold border border-primary/10">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Year {year}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No years assigned</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-muted-foreground">Specializations (Subjects Handled)</Label>
                                    <div className="grid gap-2">
                                        {user.subjects?.length > 0 ? (
                                            user.subjects.map((subject: string) => (
                                                <div key={subject} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-primary/20 transition-colors group">
                                                    <span className="text-sm font-semibold">{subject}</span>
                                                    <Badge variant="outline" className="rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">Core</Badge>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No subjects listed</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
