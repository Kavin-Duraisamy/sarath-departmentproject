import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const USERS_FILE = path.join(process.cwd(), "public", "staff-users.json")

interface StaffUser {
    id: string
    username: string
    password: string
    name: string
    role: "admin" | "hod" | "placement" | "faculty"
    department?: string
    email?: string
}

// Helper to read users from file
function readUsers(): StaffUser[] {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            // Create file with demo users if it doesn't exist
            const demoUsers: StaffUser[] = [
                {
                    id: "admin-demo",
                    username: "admin@example.com",
                    password: "admin123",
                    name: "System Admin",
                    role: "admin",
                    email: "admin@example.com",
                    department: ""
                }
            ]
            fs.writeFileSync(USERS_FILE, JSON.stringify(demoUsers, null, 2))
            return demoUsers
        }
        const data = fs.readFileSync(USERS_FILE, "utf-8")
        return JSON.parse(data)
    } catch (error) {
        console.error("Error reading users file:", error)
        return []
    }
}

// Helper to write users to file
function writeUsers(users: StaffUser[]): boolean {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
        return true
    } catch (error) {
        console.error("Error writing users file:", error)
        return false
    }
}

// GET - Fetch all users (without passwords for security)
export async function GET() {
    try {
        const users = readUsers()
        // Remove passwords from response
        const safeUsers = users.map(({ password, ...user }) => user)
        return NextResponse.json(safeUsers)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}

// POST - Add a new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { username, password, name, role, department, email } = body

        if (!username || !password || !name || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const users = readUsers()

        // Check if username already exists
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return NextResponse.json({ error: "Username already exists" }, { status: 409 })
        }

        const newUser: StaffUser = {
            id: Date.now().toString(),
            username,
            password,
            name,
            role,
            department: department || "",
            email: email || ""
        }

        users.push(newUser)

        if (writeUsers(users)) {
            // Return user without password
            const { password: _, ...safeUser } = newUser
            return NextResponse.json(safeUser, { status: 201 })
        } else {
            return NextResponse.json({ error: "Failed to save user" }, { status: 500 })
        }
    } catch (error) {
        console.error("Error adding user:", error)
        return NextResponse.json({ error: "Failed to add user" }, { status: 500 })
    }
}

// DELETE - Remove a user
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const users = readUsers()
        const filteredUsers = users.filter(u => u.id !== id)

        if (filteredUsers.length === users.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        if (writeUsers(filteredUsers)) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
        }
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }
}
