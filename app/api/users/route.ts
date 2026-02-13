import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import fs from "fs"
import path from "path"

function logDebug(message: string, data?: any) {
    try {
        const logPath = path.join(process.cwd(), 'proxy-debug.log');
        const timestamp = new Date().toISOString();
        const start = `\n[${timestamp}] ${message}\n`;
        const payload = data ? JSON.stringify(data, null, 2) + '\n' : '';
        fs.appendFileSync(logPath, start + payload);
    } catch (e) {
        console.error("Failed to write to debug log", e);
    }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"

// Helper to get auth header
async function getAuthHeader() {
    const session = await getServerSession(authOptions)
    const token = (session as any)?.accessToken
    if (!token) return null
    return {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
}

// GET - Fetch all users
export async function GET() {
    try {
        const headers = await getAuthHeader()
        if (!headers) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const response = await fetch(`${API_URL}/users`, { headers })

        if (!response.ok) {
            // Pass through backend error status
            const errorData = await response.json().catch(() => ({}))
            return NextResponse.json(errorData, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}

// POST - Add a new user
export async function POST(request: NextRequest) {
    logDebug("[POST] User creation request received");
    try {
        logDebug("[POST] Getting session");
        const headers = await getAuthHeader()
        logDebug("[POST] Headers obtained", headers ? "yes" : "no");

        if (!headers) {
            logDebug("[POST] Unauthorized - No headers");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()

        logDebug("[Proxy] Creating user:", body.username)

        const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        })

        logDebug("[Proxy] Backend response status:", response.status);

        const data = await response.json()
        logDebug("[Proxy] Backend data:", data);

        if (!response.ok) {
            console.log("[Proxy] Backend error:", data)
            return NextResponse.json(data, { status: response.status })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error("Error adding user:", error)
        logDebug("[Proxy] Exception", { message: error.message, stack: error.stack });
        return NextResponse.json({ error: "Failed to add user: " + error.message }, { status: 500 })
    }
}

// DELETE - Remove a user
export async function DELETE(request: NextRequest) {
    try {
        const headers = await getAuthHeader()
        if (!headers) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const response = await fetch(`${API_URL}/users/${id}`, {
            method: "DELETE",
            headers
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            return NextResponse.json(errorData, { status: response.status })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }
}
