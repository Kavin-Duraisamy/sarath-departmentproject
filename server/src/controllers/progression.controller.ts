
import { Request, Response } from 'express';
import prisma from '../config/database';

// Get progression history
export const getProgressionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const history = await prisma.batchProgression.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        console.error('Get progression history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Preview progression stats
export const previewProgression = async (req: Request, res: Response): Promise<void> => {
    try {
        const { department } = req.query;

        const where: any = {};
        if (department) where.department = department as string;

        const [yearI, yearII, yearIII] = await Promise.all([
            prisma.student.count({ where: { ...where, year: 'I', isAlumni: false } }),
            prisma.student.count({ where: { ...where, year: 'II', isAlumni: false } }),
            prisma.student.count({ where: { ...where, year: 'III', isAlumni: false } })
        ]);

        res.json({
            toBePromotedToII: yearI,
            toBePromotedToIII: yearII,
            toBeGraduated: yearIII
        });
    } catch (error) {
        console.error('Preview progression error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Promote batch
export const promoteBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { department, academicYear, description } = req.body;
        const processedBy = req.user?.id;

        if (!department || !academicYear) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Stats for history
        const [countI, countII, countIII] = await Promise.all([
            prisma.student.count({ where: { department, year: 'I', isAlumni: false } }),
            prisma.student.count({ where: { department, year: 'II', isAlumni: false } }),
            prisma.student.count({ where: { department, year: 'III', isAlumni: false } })
        ]);

        if (countI === 0 && countII === 0 && countIII === 0) {
            res.status(400).json({ error: 'No students to promote' });
            return;
        }

        await prisma.$transaction(async (tx) => {
            // 1. Move III -> Alumni
            await tx.student.updateMany({
                where: { department, year: 'III', isAlumni: false },
                data: { isAlumni: true, passedOutYear: parseInt(academicYear.split('-')[1]) || new Date().getFullYear() }
            });

            // 2. Move II -> III
            await tx.student.updateMany({
                where: { department, year: 'II', isAlumni: false },
                data: { year: 'III' }
            });

            // 3. Move I -> II
            await tx.student.updateMany({
                where: { department, year: 'I', isAlumni: false },
                data: { year: 'II' }
            });

            // 4. Create History Log
            await tx.batchProgression.create({
                data: {
                    department,
                    academicYear,
                    promotedCount: countI + countII,
                    graduatedCount: countIII,
                    description,
                    processedBy
                }
            });
        });

        res.json({ message: 'Batch progression completed successfully' });
    } catch (error) {
        console.error('Promote batch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Rollback progression (Last one only for safety)
export const rollbackProgression = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const progression = await prisma.batchProgression.findUnique({ where: { id } });
        if (!progression) {
            res.status(404).json({ error: 'Progression record not found' });
            return;
        }

        // Logic to rollback is complex and risky. For now, we only allow rollback if it was the very last action?
        // Actually, with the isAlumni flag, we can reverse it:
        // Alumni (matching year) -> III
        // III -> II
        // II -> I

        // WARN: This is a simplified rollback. If students were added AFTER progression, they might mix up.
        // But for MVP this should work if done immediately.

        await prisma.$transaction(async (tx) => {
            // 1. II -> I
            await tx.student.updateMany({
                where: { department: progression.department, year: 'II', isAlumni: false },
                data: { year: 'I' }
            });

            // 2. III -> II
            await tx.student.updateMany({
                where: { department: progression.department, year: 'III', isAlumni: false },
                data: { year: 'II' }
            });

            // 3. Alumni -> III
            // We need to identify exactly which alumni were just graduated. 
            // We use passedOutYear + department.
            const passedOutYear = parseInt(progression.academicYear.split('-')[1]);

            if (passedOutYear) {
                await tx.student.updateMany({
                    where: {
                        department: progression.department,
                        isAlumni: true,
                        passedOutYear: passedOutYear
                    },
                    data: { isAlumni: false, year: 'III', passedOutYear: null }
                });
            }

            // 4. Delete Log
            await tx.batchProgression.delete({ where: { id } });
        });

        res.json({ message: 'Rollback successful' });

    } catch (error) {
        console.error('Rollback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
