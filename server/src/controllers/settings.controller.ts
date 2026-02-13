import { Request, Response } from 'express';
import prisma from '../config/database';

// Get system settings
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'global' }
        });

        // Initialize with defaults if not exists
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: 'global' }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// Update system settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { instituteName, academicYear, semester, minCGPA, enableNotifications, enableProjectSimilarity, similarityThreshold } = req.body;

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'global' },
            create: {
                id: 'global',
                instituteName,
                academicYear,
                semester,
                minCGPA: parseFloat(minCGPA),
                enableNotifications,
                enableProjectSimilarity,
                similarityThreshold: parseInt(similarityThreshold)
            },
            update: {
                instituteName,
                academicYear,
                semester,
                minCGPA: minCGPA !== undefined ? parseFloat(minCGPA) : undefined,
                enableNotifications,
                enableProjectSimilarity,
                similarityThreshold: similarityThreshold !== undefined ? parseInt(similarityThreshold) : undefined
            }
        });

        res.json(settings);
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
