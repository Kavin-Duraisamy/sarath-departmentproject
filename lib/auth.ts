import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import fs from "fs"
import path from "path"

interface StaffUser {
    id: string
    username: string
    password: string
    name: string
    role: "admin" | "hod" | "placement" | "faculty"
    department?: string
    email?: string
}

// Helper to read staff users from JSON file
function readStaffUsers(): StaffUser[] {
    try {
        const filePath = path.join(process.cwd(), "public", "staff-users.json")
        if (!fs.existsSync(filePath)) {
            return []
        }
        const data = fs.readFileSync(filePath, "utf-8")
        return JSON.parse(data)
    } catch (error) {
        console.error("Error reading staff users:", error)
        return []
    }
}

function logDebug(message: string, data?: any) {
    try {
        const logPath = path.join(process.cwd(), 'auth-debug.log');
        const timestamp = new Date().toISOString();
        const start = `\n[${timestamp}] ${message}\n`;
        const payload = data ? JSON.stringify(data, null, 2) + '\n' : '';
        fs.appendFileSync(logPath, start + payload);
    } catch (e) {
        console.error("Failed to write to debug log", e);
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "hod@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("[NextAuth] Authorize called with:", credentials)
                logDebug("Authorize called", { email: credentials?.email });

                if (!credentials?.email || !credentials?.password) {
                    logDebug("Missing credentials");
                    return null
                }

                try {
                    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
                    logDebug(`Fetching ${apiUrl}`);

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password
                        })
                    });

                    logDebug("Response status", response.status);

                    const data = await response.json();

                    if (response.ok && data.user) {
                        console.log(`[NextAuth] Success: Authenticated as ${data.user.role}`);
                        logDebug("Login Success", { role: data.user.role });
                        return {
                            id: data.user.id,
                            name: data.user.name,
                            email: data.user.email,
                            role: data.user.role.toLowerCase(), // Frontend expects lowercase
                            department: data.user.department,
                            accessToken: data.accessToken,
                            rollNumber: data.user.rollNumber // Add roll number if present
                        };
                    }

                    console.log("[NextAuth] Authentication failed:", data.error || "Unknown error");
                    logDebug("Authentication failed", data);
                    return null;
                } catch (error: any) {
                    console.error("[NextAuth] Login request error:", error);
                    logDebug("Login Request Error", { message: error.message, stack: error.stack });
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: { token: any, user: any }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.department = user.department
                token.accessToken = user.accessToken
                token.rollNumber = user.rollNumber // For students
            }
            return token
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                // Ensure ID is passed to session. User id is often in 'sub' of token by default, but we use explicit 'id'
                session.user.id = token.id || token.sub
                session.user.role = token.role
                session.user.department = token.department
                session.accessToken = token.accessToken
                session.user.rollNumber = token.rollNumber // Pass roll number
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    }
}
