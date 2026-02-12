"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileDown } from "lucide-react"
import { apiClient } from "@/lib/api"

// Redefining Student type here for simplicity if export is tricky, 
// or ideally move it to a shared types file. For now, I'll copy the structure 
// to ensure it works immediately without refactoring the whole codebase.
type Student = {
    id: string
    name: string
    rollNumber: string
    email: string
    year: "I" | "II" | "III"
    department: string
    dob: string
    phone: string
    batch: string
    profile: {
        bloodGroup?: string
        communicationCategory?: string
        skills?: string
        profileImage?: string
        avatarUrl?: string
        profilePic?: string
        fatherName?: string
        fatherPhone?: string
        motherName?: string
        motherPhone?: string
        guardianName?: string
        guardianPhone?: string
        address?: string
    }
    academics: {
        cgpa?: number
        semesters?: Record<string, { sgpa: number; arrears: number }>
    }
    internships: Array<{
        id: string
        company: string
        role: string
        duration: string
        description?: string
        certificateUrl?: string
        certificateFileName?: string // Added
    }>
    resumes: Array<{
        id: string
        name: string
        fileUrl: string
        fileName?: string // Added
        uploadedAt: string
        isActive: boolean
    }>
    projects: {
        intern?: {
            title: string
            description: string
        }
        final?: {
            title: string
            description: string
            status: string
        }
    }
    certificates: Array<{
        id: string
        name: string
        issuedBy: string
        issueDate: string
        fileUrl: string
        fileName?: string // Added
        category: string
    }>
}

export default function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { data: session, status } = useSession() // Re-enabled
    const [user, setUser] = useState<any>(null)
    const [student, setStudent] = useState<Student | null>(null)

    // Auth check
    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/")
            return
        }

        const userData = session?.user
        if (!userData || userData.role !== "hod") {
            if (userData?.role) router.push(`/dashboard/${userData.role}`)
            else router.push("/")
            return
        }

        setUser(userData)
    }, [session, status, router])

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                // Sync token if needed (though HOD dashboard usually handles it)
                if ((session as any)?.accessToken) {
                    // Ensure apiClient has token if reloaded directly on this page
                    // Ideally logic is in lib/auth or middleware but here safety:
                    localStorage.setItem("accessToken", (session as any)?.accessToken);
                }

                const res = await apiClient.getStudent(id);
                const data = res.data;

                // Transform API data to match frontend Student type
                const transformedStudent: Student = {
                    id: data.id,
                    name: data.name,
                    rollNumber: data.rollNumber,
                    email: data.email,
                    year: data.year,
                    department: data.department,
                    dob: data.dob,
                    phone: data.phone,
                    batch: data.batch,
                    profile: {
                        profilePic: data.profilePic,
                        address: data.address,
                        bloodGroup: data.bloodGroup,
                        fatherName: data.fatherName,
                        fatherPhone: data.fatherPhone,
                        motherName: data.motherName,
                        motherPhone: data.motherPhone,
                        guardianName: data.guardianName,
                        guardianPhone: data.guardianPhone,
                        skills: data.skills,
                        communicationCategory: data.communicationCategory,
                    },
                    academics: {
                        // Calculate generic CGPA or use what's available. 
                        // Logic refactored to aggregate from records
                        cgpa: data.academicRecords?.reduce((acc: number, curr: any) => acc + (curr.sgpa || 0), 0) / (data.academicRecords?.length || 1) || 0,
                        semesters: data.academicRecords?.reduce((acc: any, curr: any) => {
                            acc[curr.semester] = { sgpa: curr.sgpa, arrears: curr.arrears };
                            return acc;
                        }, {}) || {}
                    },
                    internships: data.internships?.map((intern: any) => ({
                        id: intern.id,
                        company: intern.company,
                        role: intern.role,
                        duration: intern.duration,
                        description: intern.description,
                        certificateUrl: intern.certificate, // Map certificate to certificateUrl
                    })) || [],
                    resumes: data.resumes?.map((res: any) => ({
                        id: res.id,
                        name: res.title, // Map title to name
                        fileUrl: res.fileUrl,
                        uploadedAt: res.uploadedAt,
                        isActive: true
                    })) || [],
                    certificates: data.certificates?.map((cert: any) => ({
                        id: cert.id,
                        name: cert.title, // Map title to name
                        issuedBy: cert.issuer, // Map issuer to issuedBy
                        issueDate: cert.issuedDate,
                        fileUrl: cert.fileUrl,
                        category: "Certificate"
                    })) || [],
                    projects: {
                        intern: data.projects?.find((p: any) => p.type === 'INTERNSHIP') ? {
                            title: data.projects.find((p: any) => p.type === 'INTERNSHIP').title,
                            description: data.projects.find((p: any) => p.type === 'INTERNSHIP').description
                        } : undefined,
                        final: data.projects?.find((p: any) => p.type === 'FINAL_YEAR') ? {
                            title: data.projects.find((p: any) => p.type === 'FINAL_YEAR').title,
                            description: data.projects.find((p: any) => p.type === 'FINAL_YEAR').description,
                            status: data.projects.find((p: any) => p.type === 'FINAL_YEAR').status
                        } : undefined
                    }
                };

                setStudent(transformedStudent);
            } catch (error) {
                console.error("Error fetching student details:", error);

                // Fallback attempt? likely not needed if API is primary.
                // But let's check localStorage just in case as a "cache" if API fails?? 
                // No, mixed sources are bad. Stick to API.
                alert("Failed to load student details.");
                router.push("/dashboard/hod/students");
            }
        };

        if (id && session) {
            fetchStudentDetails();
        }
    }, [id, session, router])

    const handleDownloadDocument = (url: string, baseFilename: string, originalFileName?: string) => {
        if (!url) {
            console.error("No URL provided for download")
            return
        }

        try {
            // First priority: Use the original filename provided during upload if available
            if (originalFileName) {
                const link = document.createElement("a")
                link.href = url
                link.download = originalFileName
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                return
            }

            // Fallback: Detect extension from data URL
            let extension = "pdf" // default fallback
            if (url.startsWith("data:")) {
                const mimeType = url.split(";")[0].split(":")[1]
                if (mimeType === "image/jpeg") extension = "jpg"
                else if (mimeType === "image/png") extension = "png"
                else if (mimeType === "application/pdf") extension = "pdf"
                else if (mimeType === "application/msword" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") extension = "docx"
            }

            // Ensure filename has the correct extension
            const filename = baseFilename.endsWith(`.${extension}`)
                ? baseFilename
                : `${baseFilename}.${extension}`

            const link = document.createElement("a")
            link.href = url
            // Use the corrected filename
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (e) {
            console.error("Download failed:", e)
            alert("Failed to download file. The file format might be incorrect.")
        }
    }

    const handleResetPassword = () => {
        if (!student) return
        const studentLogins = JSON.parse(localStorage.getItem("studentLogins") || "{}")
        studentLogins[student.rollNumber] = {
            password: student.dob,
            role: "student",
            name: student.name,
            studentId: student.id,
        }
        localStorage.setItem("studentLogins", JSON.stringify(studentLogins))
        alert(`Password reset to DOB: ${student.dob}`)
    }

    if (!student) {
        return <div className="p-8">Loading student details...</div>
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-xl font-semibold">Student Profile</h1>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleResetPassword}>
                            Reset Password
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Sidebar: Profile Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="overflow-hidden border-t-4 border-t-primary shadow-md">
                            <CardHeader className="bg-muted/30 pb-8 pt-8 text-center flex flex-col items-center">
                                {student.profile.profilePic || student.profile.profileImage || student.profile.avatarUrl ? (
                                    <div className="h-32 w-32 rounded-full mb-4 ring-4 ring-background overflow-hidden bg-muted">
                                        <img
                                            src={student.profile.profilePic || student.profile.profileImage || student.profile.avatarUrl}
                                            alt={student.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary mb-4 ring-4 ring-background">
                                        {student.name.charAt(0)}
                                    </div>
                                )}
                                <CardTitle className="text-2xl">{student.name}</CardTitle>
                                <Badge variant="outline" className="mt-2 text-base px-3 py-1 font-normal">
                                    {student.rollNumber}
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    <div className="flex justify-between p-5 hover:bg-muted/5 transition-colors">
                                        <span className="text-muted-foreground font-medium">Department</span>
                                        <span className="font-semibold">{student.department}</span>
                                    </div>
                                    <div className="flex justify-between p-5 hover:bg-muted/5 transition-colors">
                                        <span className="text-muted-foreground font-medium">Batch</span>
                                        <span className="font-semibold">{student.year} ({student.batch})</span>
                                    </div>
                                    <div className="flex justify-between p-5 hover:bg-muted/5 transition-colors">
                                        <span className="text-muted-foreground font-medium">Phone</span>
                                        <span className="font-semibold">{student.phone}</span>
                                    </div>
                                    <div className="p-5 hover:bg-muted/5 transition-colors space-y-1">
                                        <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider">Email</span>
                                        <span className="font-semibold break-all text-base">{student.email}</span>
                                    </div>
                                    <div className="flex justify-between p-5 hover:bg-muted/5 transition-colors">
                                        <span className="text-muted-foreground font-medium">DOB</span>
                                        <span className="font-semibold">{student.dob}</span>
                                    </div>
                                    <div className="flex justify-between p-5 hover:bg-muted/5 transition-colors">
                                        <span className="text-muted-foreground font-medium">Blood Group</span>
                                        <span className="font-semibold">{student.profile.bloodGroup || 'N/A'}</span>
                                    </div>

                                    {/* Parent & Other Details */}
                                    {(student.profile.fatherName || student.profile.motherName || student.profile.guardianName) && (
                                        <div className="p-5 hover:bg-muted/5 transition-colors border-t">
                                            <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider mb-3">Family Information</span>

                                            {student.profile.fatherName && (
                                                <div className="mb-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Father</span>
                                                        <span className="font-semibold text-sm">{student.profile.fatherName}</span>
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-xs text-muted-foreground pl-2">Phone</span>
                                                        <span className={`text-xs ${student.profile.fatherPhone ? "font-mono" : "text-muted-foreground italic"}`}>
                                                            {student.profile.fatherPhone || "Not provided"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {student.profile.motherName && (
                                                <div className="mb-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Mother</span>
                                                        <span className="font-semibold text-sm">{student.profile.motherName}</span>
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-xs text-muted-foreground pl-2">Phone</span>
                                                        <span className={`text-xs ${student.profile.motherPhone ? "font-mono" : "text-muted-foreground italic"}`}>
                                                            {student.profile.motherPhone || "Not provided"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {(student.profile.guardianName || student.profile.guardianPhone) && (
                                                <div className="mt-3 border-t border-dashed pt-2">
                                                    {student.profile.guardianName && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-muted-foreground">Guardian</span>
                                                            <span className="font-semibold text-sm">{student.profile.guardianName}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-xs text-muted-foreground pl-2">Phone</span>
                                                        <span className={`text-xs ${student.profile.guardianPhone ? "font-mono" : "text-muted-foreground italic"}`}>
                                                            {student.profile.guardianPhone || "Not provided"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {student.profile.address && (
                                        <div className="p-5 hover:bg-muted/5 transition-colors border-t space-y-1">
                                            <span className="text-muted-foreground font-medium block text-xs uppercase tracking-wider">Address</span>
                                            <p className="font-medium text-sm leading-relaxed text-right">{student.profile.address}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {student.profile.skills && (
                            <Card className="shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-lg">Skills</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Fixed wrapping and spacing */}
                                    <div className="flex flex-wrap gap-2 w-full">
                                        {student.profile.skills.split(',').map((skill, i) => (
                                            <Badge key={i} variant="secondary" className="px-3 py-1 whitespace-normal text-center min-w-fit">{skill.trim()}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Content: Detailed Records */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Academic Performance */}
                        {student.academics.cgpa && (
                            <Card className="shadow-md border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle>Academic Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end gap-3 mb-8">
                                        <span className="text-5xl font-bold text-blue-600">{student.academics.cgpa}</span>
                                        <span className="text-muted-foreground text-lg mb-1">Overall CGPA</span>
                                    </div>
                                    {student.academics.semesters && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {Object.entries(student.academics.semesters).map(([sem, data]: [string, any]) => (
                                                <div key={sem} className="p-4 bg-muted/20 rounded-xl border hover:border-blue-200 transition-colors">
                                                    <p className="font-bold mb-2 text-lg">{sem}</p>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">SGPA</span>
                                                            <span className="font-semibold">{data.sgpa || "N/A"}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Arrears</span>
                                                            <span className={`font - semibold ${data.arrears > 0 ? "text-destructive" : "text-green-600"} `}>{data.arrears || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Internships */}
                        {student.internships.length > 0 && (
                            <Card className="shadow-md">
                                <CardHeader>
                                    <CardTitle>Internships & Experience</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {student.internships.map((intern) => (
                                            <div key={intern.id} className="relative pl-6 border-l-2 border-primary/20 pb-2">
                                                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-4 border-primary" />
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{intern.company}</h3>
                                                        <p className="text-primary font-medium">{intern.role}</p>
                                                    </div>
                                                    <Badge variant="outline" className="w-fit">{intern.duration}</Badge>
                                                </div>
                                                {intern.description && <p className="mt-3 text-muted-foreground leading-relaxed">{intern.description}</p>}
                                                {intern.certificateUrl && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="mt-4"
                                                        onClick={() => handleDownloadDocument(intern.certificateUrl!, `${intern.company} _certificate`, intern.certificateFileName)}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download Certificate
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Projects */}
                        {(student.projects.intern || student.projects.final) && (
                            <Card className="shadow-md">
                                <CardHeader>
                                    <CardTitle>Projects</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    {student.projects.intern?.title && (
                                        <div className="p-6 bg-yellow-500/5 rounded-xl border border-yellow-200/50">
                                            <h4 className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-yellow-500" /> Internship Project
                                            </h4>
                                            <p className="font-bold text-lg mb-2">{student.projects.intern.title}</p>
                                            <p className="text-muted-foreground">{student.projects.intern.description}</p>
                                        </div>
                                    )}
                                    {student.projects.final?.title && (
                                        <div className="p-6 bg-blue-500/5 rounded-xl border border-blue-200/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Final Year Project
                                                </h4>
                                                {student.projects.final.status && (
                                                    <Badge variant={student.projects.final.status === 'approved' ? 'default' : 'secondary'}>
                                                        {student.projects.final.status}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-bold text-lg mb-2">{student.projects.final.title}</p>
                                            <p className="text-muted-foreground">{student.projects.final.description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Resumes */}
                        {student.resumes.length > 0 && (
                            <Card className="shadow-md">
                                <CardHeader>
                                    <CardTitle>Resumes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-3">
                                        {student.resumes.map((resume) => (
                                            <div key={resume.id} className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg hover:border-primary/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-background rounded-lg border flex items-center justify-center text-primary shadow-sm">
                                                        <FileDown className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-base">{resume.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {resume.isActive && <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>}
                                                    <Button size="sm" variant="ghost" onClick={() => handleDownloadDocument(resume.fileUrl, resume.name, resume.fileName)}>
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Certificates */}
                        {student.certificates.length > 0 && (
                            <Card className="shadow-md">
                                <CardHeader>
                                    <CardTitle>Certificates</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {student.certificates.map((cert) => (
                                            <div key={cert.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-card">
                                                <div className="mb-4">
                                                    <Badge variant="outline" className="mb-2">{cert.category}</Badge>
                                                    <p className="font-bold text-base line-clamp-1" title={cert.name}>{cert.name}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{cert.issuedBy}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(cert.issueDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleDownloadDocument(cert.fileUrl, cert.name, cert.fileName)}>
                                                    <Download className="h-3 w-3 mr-2" /> Download
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </main>
        </div>
    )
}
