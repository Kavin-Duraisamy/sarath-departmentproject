import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';

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
        }
        // FACULTY only see their own department (if they have access to this endpoint)
        else if (currentUser.role === 'FACULTY' && currentUser.department) {
            where = { department: currentUser.department };
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
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

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
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let { username, email, password, name, role, department } = req.body;

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
                role,
                department: department || null,
            },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                department: true,
            },
        });

        res.status(201).json(user);
    } catch (error: any) {
        console.error('Create user error:', error);

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Username or email already exists' });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { username, email, name, role, department, password } = req.body;
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
