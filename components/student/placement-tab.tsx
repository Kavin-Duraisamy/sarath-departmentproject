"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Briefcase, MapPin, IndianRupee, Link as LinkIcon } from "lucide-react"

interface PlacementTabProps {
    studentId: string
}

export function PlacementTab({ studentId }: PlacementTabProps) {
    const { toast } = useToast()
    const [companies, setCompanies] = useState<any[]>([])
    const [applications, setApplications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            setLoading(true)
            const [companiesRes, applicationsRes] = await Promise.all([
                apiClient.getCompanies(),
                apiClient.getApplications() // Ideally this should be student-specific in a real app
            ])

            const parsedCompanies = companiesRes.data.map((c: any) => ({
                ...c,
                eligibility: typeof c.eligibility === 'string' ? JSON.parse(c.eligibility) : c.eligibility
            }))

            setCompanies(parsedCompanies)
            // Filter applications for current student if the API doesn't do it
            setApplications(applicationsRes.data.filter((app: any) => app.studentId === studentId))
        } catch (error) {
            console.error("Failed to fetch placement data", error)
            toast({
                title: "Error",
                description: "Failed to load placement opportunities.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [studentId])

    const handleApply = async (companyId: string) => {
        try {
            await apiClient.applyForCompany(companyId)
            toast({
                title: "Success",
                description: "Application submitted successfully!"
            })
            fetchData()
        } catch (error: any) {
            console.error("Failed to apply", error)
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to submit application.",
                variant: "destructive"
            })
        }
    }

    const getApplicationStatus = (companyId: string) => {
        const app = applications.find(a => a.companyId === companyId)
        return app ? app.status : null
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Placement Opportunities</h2>
            </div>

            {companies.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No placement opportunities available at the moment.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {companies.map((company) => {
                        const status = getApplicationStatus(company.id)
                        return (
                            <Card key={company.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-background rounded-lg border">
                                                <Building2 className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{company.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">{company.jobRole}</p>
                                            </div>
                                        </div>
                                        {status && (
                                            <Badge variant={status === "SELECTED" ? "default" : "secondary"}>
                                                {status === "SELECTED" ? "Placed" : status}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <IndianRupee className="h-4 w-4" />
                                                Package
                                            </p>
                                            <p className="font-medium">{company.package}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                Location
                                            </p>
                                            <p className="font-medium">{company.location || "Not specified"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Briefcase className="h-4 w-4" />
                                                Deadline
                                            </p>
                                            <p className="font-medium">{company.applicationDeadline || "TBA"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Description</h4>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{company.description}</p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Eligibility Criteria</h4>
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="px-3 py-1 bg-muted rounded-full">
                                                    Min CGPA: {company.eligibility?.minCGPA || "N/A"}
                                                </div>
                                                <div className="px-3 py-1 bg-muted rounded-full capitalize">
                                                    Communication: {company.eligibility?.communicationCategories?.join(", ") || "Any"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {company.website && (
                                                <a
                                                    href={company.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                    Company Website
                                                </a>
                                            )}
                                        </div>
                                        <Button
                                            disabled={!!status}
                                            onClick={() => handleApply(company.id)}
                                        >
                                            {status ? "Already Applied" : "Apply Now"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
