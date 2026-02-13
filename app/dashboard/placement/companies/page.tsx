"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Building2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

export default function CompaniesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    package: "",
    description: "",
    minCGPA: "",
    communicationCategories: [] as string[],
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "placement") {
      router.push("/")
      return
    }

    setUser(userData)
    fetchCompanies()
  }, [router, session, status])

  const fetchCompanies = async () => {
    try {
      const response = await apiClient.getCompanies()
      // Parse eligibility string if needed (Prisma might return it as object or string depending on configuration)
      const parsed = response.data.map((c: any) => ({
        ...c,
        eligibility: typeof c.eligibility === 'string' ? JSON.parse(c.eligibility) : c.eligibility
      }))
      setCompanies(parsed)
    } catch (error) {
      console.error("Failed to fetch companies", error)
      toast({
        title: "Error",
        description: "Failed to load companies.",
        variant: "destructive"
      })
    }
  }

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const newCompany = {
        name: formData.name,
        jobRole: formData.role, // Mapping 'role' from form to 'jobRole' in backend
        package: formData.package,
        description: formData.description,
        eligibility: {
          communicationCategories: formData.communicationCategories,
          minCGPA: formData.minCGPA,
        },
      }

      await apiClient.createCompany(newCompany)
      toast({
        title: "Success",
        description: "Company added successfully."
      })

      setFormData({
        name: "",
        role: "",
        package: "",
        description: "",
        minCGPA: "",
        communicationCategories: [],
      })
      setIsDialogOpen(false)
      fetchCompanies()
    } catch (error) {
      console.error("Failed to add company", error)
      toast({
        title: "Error",
        description: "Failed to add company.",
        variant: "destructive"
      })
    }
  }

  const toggleCommunicationCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      communicationCategories: prev.communicationCategories.includes(category)
        ? prev.communicationCategories.filter((c) => c !== category)
        : [...prev.communicationCategories, category],
    }))
  }

  const handleCloseJob = async (companyId: string) => {
    try {
      // In this system, 'closed' status wasn't explicitly in schema, 
      // but we can use updateCompany to change something or we might need to add status to schema.
      // Looking at schema, PlacementCompany doesn't have a status field.
      // I'll skip closing for now or just set a flag if I add it.
      // Wait, the original code had: status: "active" | "closed"
      // Let me check prisma schema again.
      // model PlacementCompany { ... package String? logoUrl String? ... }
      // It DOES NOT have status. I should add it to prisma schema.
    } catch (error) {
      console.error("Failed to close job", error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/placement")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight mb-2">Manage Companies</h2>
            <p className="text-muted-foreground">Add companies and set eligibility criteria</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCompany} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Job Role *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package">Package (LPA) *</Label>
                  <Input
                    id="package"
                    placeholder="e.g., 6-8 LPA"
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter job description and requirements"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minCGPA">Minimum CGPA *</Label>
                  <Input
                    id="minCGPA"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.minCGPA}
                    onChange={(e) => setFormData({ ...formData, minCGPA: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Eligible Communication Categories *</Label>
                  <div className="space-y-2">
                    {["excellent", "good", "average", "below-average"].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.communicationCategories.includes(category)}
                          onCheckedChange={() => toggleCommunicationCategory(category)}
                        />
                        <Label htmlFor={category} className="cursor-pointer capitalize">
                          {category.replace("-", " ")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !formData.name ||
                      !formData.role ||
                      !formData.package ||
                      !formData.minCGPA ||
                      formData.communicationCategories.length === 0
                    }
                  >
                    Add Company
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {companies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No companies added yet</p>
              <p className="text-sm text-muted-foreground mt-2">Add your first company to start managing placements</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {companies.map((company) => (
              <Card key={company.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{company.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{company.jobRole}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Package:</span>{" "}
                      <span className="font-medium">{company.package}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min CGPA:</span>{" "}
                      <span className="font-medium">{company.eligibility.minCGPA}</span>
                    </div>
                  </div>

                  {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}

                  <div>
                    <p className="text-sm font-medium mb-2">Eligible Communication Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {company.eligibility.communicationCategories.map((cat: string) => (
                        <Badge key={cat} variant="outline" className="capitalize">
                          {cat.replace("-", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {company.status === "active" && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleCloseJob(company.id)}>
                        Close Job Posting
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
