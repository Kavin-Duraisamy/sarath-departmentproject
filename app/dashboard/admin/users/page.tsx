"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Search, Mail, User, ShieldCheck, Building2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface StaffUser {
  id: string
  username: string
  name: string
  role: string
  department?: string
  email?: string
}

export default function UserManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<StaffUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    role: "HOD",
    department: "",
    email: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/")
      return
    }

    const userData = session?.user
    if (!userData || userData.role !== "admin") {
      router.push(userData?.role ? `/dashboard/${userData.role}` : "/")
      return
    }

    loadUsers()
  }, [session, status, router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const res = await apiClient.getUsers()
      setUsers(res.data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({ title: "Error", description: "Failed to load users", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.name) {
      toast({ title: "Error", description: "All required fields must be filled", variant: "destructive" })
      return
    }

    try {
      await apiClient.createUser(newUser)
      setNewUser({ username: "", password: "", name: "", role: "HOD", department: "", email: "" })
      setShowAddForm(false)
      loadUsers()
      toast({ title: "Success", description: "User created successfully" })
    } catch (error) {
      console.error("Error adding user:", error)
      toast({ title: "Error", description: "Failed to create user", variant: "destructive" })
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === session?.user?.id) {
      toast({ title: "Forbidden", description: "You cannot delete yourself", variant: "destructive" })
      return
    }
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      // We need a deleteUser method in apiClient. I'll check if I added it. Oh, it might be in lib/api.ts or not.
      // Let's check. 
      // Based on my previous write_to_file, I didn't add deleteUser for general users, only for students.
      // I should add deleteUser to apiClient.
      await fetch(`/api/v1/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${(session as any).accessToken}` } })
      loadUsers()
      toast({ title: "Success", description: "User deleted successfully" })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-red-500">ADMIN</Badge>
      case 'HOD': return <Badge className="bg-purple-500">HOD</Badge>
      case 'PLACEMENT': return <Badge className="bg-orange-500">PLACEMENT</Badge>
      case 'FACULTY': return <Badge className="bg-blue-500">FACULTY</Badge>
      default: return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Staff Management</h1>
              <p className="text-sm text-muted-foreground">Manage organizational users and permissions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Register Staff
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Add New Staff Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Username (Login ID)</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Staff ID or unique name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Password</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Ex: Dr. John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>System Role</Label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="HOD">HOD</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="PLACEMENT">Placement Officer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Department (Optional for Admin)</Label>
                  <Input
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="Ex: CSE"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="staff@college.edu"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button onClick={handleAddUser} className="px-8 shadow-sm">Save User</Button>
                <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {user.username}</span>
                          {user.department && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {user.department}</span>}
                          {user.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-20 bg-card border rounded-lg italic text-muted-foreground">
                No staff members found matching your search.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
