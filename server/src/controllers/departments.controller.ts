import { Request, Response } from 'express';
import prisma from '../config/database';

// Get all departments with student and faculty counts
export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' }
        });

        const deptsWithStats = await Promise.all(departments.map(async (dept) => {
            const [studentCount, facultyCount] = await Promise.all([
                prisma.student.count({ where: { department: dept.name } }),
                prisma.user.count({ where: { department: dept.name, role: 'FACULTY' } })
            ]);

            const hod = await prisma.user.findFirst({
                where: {
                    department: dept.name,
                    role: 'HOD'
                },
                select: { name: true }
            });

            return {
                id: dept.id,
                name: dept.name,
                code: dept.code,
                studentCount,
                facultyCount,
                hodName: hod?.name || 'Not Assigned'
            };
        }));

        res.json(deptsWithStats);
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

// Create a new department
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, code } = req.body;
        if (!name || !code) {
            res.status(400).json({ error: 'Department name and code are required' });
            return;
        }

        const department = await prisma.department.create({
            data: { name, code }
        });

        res.status(201).json(department);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Department name or code already exists' });
            return;
        }
        res.status(500).json({ error: 'Failed to create department' });
    }
};

// Delete a department
export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.department.delete({
            where: { id: id as string }
        });
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete department' });
    }
};

// Get system statistics for Admin dashboard
export const getSystemStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [studentCount, facultyCount, deptCount, activeCompanies] = await Promise.all([
            prisma.student.count(),
            prisma.user.count({ where: { role: 'FACULTY' } }),
            prisma.department.count(),
            prisma.placementCompany.count()
        ]);

        res.json({
            students: studentCount,
            faculty: facultyCount,
            departments: deptCount,
            companies: activeCompanies
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({ error: 'Failed to fetch system statistics' });
    }
};
