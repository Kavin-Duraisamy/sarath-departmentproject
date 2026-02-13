import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApplicationStatus } from '@prisma/client';

// Get all companies
export const getCompanies = async (_req: Request, res: Response): Promise<void> => {
    try {
        const companies = await prisma.placementCompany.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { applications: true }
                }
            }
        });
        res.json(companies);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
};

// Create a new company
export const createCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, website, package: salaryPackage, eligibility, jobRole, location, applicationDeadline, driveDate } = req.body;

        const company = await prisma.placementCompany.create({
            data: {
                name,
                description,
                website,
                package: salaryPackage,
                eligibility: JSON.stringify(eligibility),
                jobRole,
                location,
                applicationDeadline,
                driveDate
            }
        });

        res.status(201).json(company);
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
};

// Update company details (e.g., closing a job)
export const updateCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const updateData = req.body;

        // If eligibility is provided, stringify it
        if (updateData.eligibility) {
            updateData.eligibility = JSON.stringify(updateData.eligibility);
        }

        const company = await prisma.placementCompany.update({
            where: { id },
            data: updateData
        });

        res.json(company);
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
};

// Apply for a company (Student)
export const applyForCompany = async (req: Request, res: Response): Promise<void> => {
    try {
        const { companyId } = req.params as { companyId: string };
        const studentId = req.user?.id; // Assuming student is logged in

        if (!studentId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const application = await prisma.placementApplication.create({
            data: {
                studentId,
                companyId,
                status: ApplicationStatus.APPLIED
            }
        });

        res.status(201).json(application);
    } catch (error) {
        console.error('Apply for company error:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
};

// Get all applications (Placement Officer)
export const getAllApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { companyId } = req.query;

        let where = {};
        if (companyId) {
            where = { companyId: companyId as string };
        }

        const applications = await prisma.placementApplication.findMany({
            where,
            include: {
                student: {
                    select: {
                        name: true,
                        rollNumber: true,
                        department: true,
                        year: true
                    }
                },
                company: true
            },
            orderBy: { appliedAt: 'desc' }
        });

        res.json(applications);
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

// Update application status (Placement Officer)
export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };
        const { status } = req.body;

        const application = await prisma.placementApplication.update({
            where: { id },
            data: { status }
        });

        res.json(application);
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ error: 'Failed to update application status' });
    }
};
// Get placement statistics
export const getPlacementStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const [totalCompanies, totalApplications, selectedStudents] = await Promise.all([
            prisma.placementCompany.count(),
            prisma.placementApplication.count(),
            prisma.placementApplication.count({
                where: { status: ApplicationStatus.SELECTED }
            })
        ]);

        res.json({
            companies: totalCompanies,
            totalApplications,
            selectedStudents,
            placementRate: totalApplications > 0 ? Math.round((selectedStudents / totalApplications) * 100) : 0
        });
    } catch (error) {
        console.error('Get placement stats error:', error);
        res.status(500).json({ error: 'Failed to fetch placement statistics' });
    }
};
