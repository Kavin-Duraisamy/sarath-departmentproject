import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

function logDebug(message: string, data?: any) {
    try {
        const logPath = path.join(process.cwd(), 'server-debug.log');
        const timestamp = new Date().toISOString();
        const start = `\n[${timestamp}] ${message}\n`;
        const payload = data ? JSON.stringify(data, null, 2) + '\n' : '';
        fs.appendFileSync(logPath, start + payload);
    } catch (e) {
        console.error("Failed to write to debug log", e);
    }
}

// Get all users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let where = {};

        // RBAC: Departmental HODs only see their department
        if (currentUser.role === 'HOD' && currentUser.department) {
            where = { department: currentUser.department };
            console.log(`[getUsers] HOD filtering by dept: "${currentUser.department}"`);
        }
        // FACULTY only see their own department
        else if (currentUser.role === 'FACULTY' && currentUser.department) {
            where = { department: currentUser.department };
            console.log(`[getUsers] Faculty filtering by dept: "${currentUser.department}"`);
        }
        // STUDENTS only see FACULTY and HOD in their department
        else if (currentUser.role === 'STUDENT' && currentUser.department) {
            where = {
                department: currentUser.department,
                role: { in: ['FACULTY', 'HOD'] }
            };
            console.log(`[getUsers] Student filtering by dept: "${currentUser.department}"`);
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                department: true,
                assignedYears: true,
                subjects: true,
                designation: true,
                qualification: true,
                experience: true,
                address: true,
                emergencyContact: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`[getUsers] Found ${users.length} users for role ${currentUser.role}`);
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single user
export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: id as string },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                department: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    console.log('[CreateUser] Request received:', req.body);
    try {
        const currentUser = req.user;
        if (!currentUser) {
            console.log('[CreateUser] Unauthorized: No current user');
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let { username, email, password, name, role, department, assignedYears, subjects, designation, qualification, experience, address, emergencyContact } = req.body;

        if (!username || !password || !name || !role) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // RBAC enforcement
        if (currentUser.role === 'HOD' && currentUser.department) {
            // Department HOD can ONLY create users for their department
            department = currentUser.department;

            // Department HOD cannot create ADMIN or PLACEMENT roles
            if (role === 'ADMIN' || role === 'PLACEMENT') {
                res.status(403).json({ error: 'Forbidden: Cannot create this role' });
                return;
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email: email || null,
                password: hashedPassword,
                name,
                role: role.toUpperCase(),
                department: department || null,
                assignedYears: assignedYears || [],
                subjects: subjects || [],
                designation: designation || null,
                qualification: qualification || null,
                experience: experience || null,
                address: address || null,
                emergencyContact: emergencyContact || null,
            },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                department: true,
                assignedYears: true,
                subjects: true,
                designation: true,
                qualification: true,
                experience: true,
                address: true,
                emergencyContact: true,
            },
        });

        console.log('[CreateUser] User created successfully:', user.username);
        res.status(201).json(user);
    } catch (error: any) {
        console.error('Create user error:', error);
        logDebug('Create user error:', error);

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Username or email already exists' });
            return;
        }

        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { username, email, name, role, department, password, assignedYears, subjects, designation, qualification, experience, address, emergencyContact } = req.body;
        const currentUser = req.user;

        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // If HOD is restricted to a department, ensure they only update their department staff
        const where: any = { id };
        if (currentUser.role === 'HOD' && currentUser.department) {
            where.department = currentUser.department;
        }

        const updateData: any = {};

        if (username) updateData.username = username;
        if (email !== undefined) updateData.email = email || null;
        if (name) updateData.name = name;
        if (assignedYears !== undefined) updateData.assignedYears = assignedYears; // Allow updating years
        if (subjects !== undefined) updateData.subjects = subjects; // Allow updating subjects
        if (designation !== undefined) updateData.designation = designation || null;
        if (qualification !== undefined) updateData.qualification = qualification || null;
        if (experience !== undefined) updateData.experience = experience || null;
        if (address !== undefined) updateData.address = address || null;
        if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact || null;
        if (role) {
            // Department HOD cannot grant ADMIN or PLACEMENT roles
            if (currentUser.role === 'HOD' && currentUser.department && (role === 'ADMIN' || role === 'PLACEMENT')) {
                res.status(403).json({ error: 'Forbidden: Cannot grant this role' });
                return;
            }
            updateData.role = role;
        }
        if (department !== undefined) {
            // Department HOD cannot change department to something else
            if (currentUser.role === 'HOD' && currentUser.department && department !== currentUser.department) {
                res.status(403).json({ error: 'Forbidden: Cannot change department' });
                return;
            }
            updateData.department = department || null;
        }

        // Hash new password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { ...where, id: id as string },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                department: true,
                assignedYears: true,
                subjects: true,
                designation: true,
                qualification: true,
                experience: true,
                address: true,
                emergencyContact: true,
            },
        });

        res.json(user);
    } catch (error: any) {
        console.error('Update user error:', error);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'User not found or unauthorized' });
            return;
        }

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Username or email already exists' });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // If HOD is restricted to a department, ensure they only delete their department staff
        const where: any = { id };
        if (currentUser.role === 'HOD' && currentUser.department) {
            where.department = currentUser.department;
        }

        await prisma.user.delete({
            where: { ...where, id: id as string },
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Delete user error:', error);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'User not found or unauthorized' });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};
