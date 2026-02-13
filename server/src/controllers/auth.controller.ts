import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const emailLower = email.toLowerCase().trim();
        console.log(`[Login] Attempt for: ${emailLower}`);

        // Try to find a staff user first
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: { equals: emailLower, mode: 'insensitive' } },
                    { email: { equals: emailLower, mode: 'insensitive' } },
                ],
            },
        });

        if (user) {
            console.log(`[Login] Found staff user: ${user.username}`);
            // Verify staff password
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log(`[Login] Password valid: ${isValidPassword}`);

            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Generate tokens
            const accessToken = generateAccessToken({
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
            });

            const refreshToken = generateRefreshToken({
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
            });

            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email || user.username,
                    role: user.role,
                    department: user.department,
                },
            });
            return;
        }

        // If not a staff user, try to find a student (checking both rollNumber and email)
        const student = await prisma.student.findFirst({
            where: {
                OR: [
                    { rollNumber: { equals: emailLower, mode: 'insensitive' } },
                    { email: { equals: emailLower, mode: 'insensitive' } },
                ],
            },
        });

        if (student) {
            console.log(`[Login] Found student: ${student.rollNumber}`);
            // Verify student password (DOB)
            const isValidPassword = await bcrypt.compare(password, student.password);
            console.log(`[Login] Student Password valid: ${isValidPassword}`);

            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            // Generate tokens
            const accessToken = generateAccessToken({
                id: student.id,
                username: student.rollNumber,
                name: student.name,
                email: student.email,
                role: 'STUDENT',
                department: student.department,
            });

            const refreshToken = generateRefreshToken({
                id: student.id,
                username: student.rollNumber,
                name: student.name,
                email: student.email,
                role: 'STUDENT',
                department: student.department,
            });

            res.json({
                accessToken,
                refreshToken,
                user: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    role: 'STUDENT',
                    department: student.department,
                    rollNumber: student.rollNumber,
                },
            });
            return;
        }

        // Neither staff nor student found
        console.log(`[Login] No user or student found for: ${emailLower}`);
        res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Generate new access token
        const newAccessToken = generateAccessToken({
            id: decoded.id,
            username: decoded.username,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role,
            department: decoded.department,
        });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (req.user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    rollNumber: true,
                    name: true,
                    email: true,
                    department: true,
                    year: true,
                    batch: true,
                    profilePic: true,
                },
            });

            if (!student) {
                res.status(404).json({ error: 'Student not found' });
                return;
            }

            res.json({
                ...student,
                role: 'STUDENT',
            });
            return;
        }

        // Staff user
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                department: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
