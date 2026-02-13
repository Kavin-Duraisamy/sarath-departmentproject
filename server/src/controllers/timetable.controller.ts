import { Request, Response } from 'express';
import prisma from '../config/database';
import { Year } from '@prisma/client';

export const getTimetableSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const departmentName = req.user?.department;
        if (!departmentName) {
            res.status(400).json({ error: 'Department not found for user' });
            return;
        }

        const department = await prisma.department.findUnique({
            where: { name: departmentName }
        });

        if (!department) {
            console.warn(`[Timetable] Department "${departmentName}" not found in database. Returning defaults.`);
            res.json({
                startTime: "08:30",
                periodDuration: 55,
                periodsPerDay: 5,
                breakAfterPeriod: 2,
                breakDuration: 25
            });
            return;
        }

        const settings = await prisma.timetableSettings.findUnique({
            where: { departmentId: department.id }
        });

        res.json(settings || {
            startTime: "08:30",
            periodDuration: 55,
            periodsPerDay: 5,
            breakAfterPeriod: 2,
            breakDuration: 25
        });
    } catch (error) {
        console.error('Get timetable settings error:', error);
        res.status(500).json({ error: 'Failed to fetch timetable settings' });
    }
};

export const updateTimetableSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const departmentName = req.user?.department;
        const { startTime, periodDuration, periodsPerDay, breakAfterPeriod, breakDuration } = req.body;

        if (!departmentName) {
            res.status(400).json({ error: 'Department not found for user' });
            return;
        }

        const department = await prisma.department.findUnique({
            where: { name: departmentName }
        });

        if (!department) {
            res.status(404).json({ error: 'Department not found in database' });
            return;
        }

        const updateData = {
            startTime,
            periodDuration: Number(periodDuration),
            periodsPerDay: Number(periodsPerDay),
            breakAfterPeriod: Number(breakAfterPeriod),
            breakDuration: Number(breakDuration)
        };

        const settings = await prisma.timetableSettings.upsert({
            where: { departmentId: department.id },
            update: updateData,
            create: {
                departmentId: department.id,
                ...updateData
            }
        });

        res.json(settings);
    } catch (error) {
        console.error('Update timetable settings error:', error);
        res.status(500).json({ error: 'Failed to update timetable settings' });
    }
};

export const getTimetableEntries = async (req: Request, res: Response): Promise<void> => {
    try {
        const { year, facultyId } = req.query as { year?: string, facultyId?: string };
        const departmentName = req.user?.department;

        if (!departmentName) {
            res.status(400).json({ error: 'Department not found for user' });
            return;
        }

        const department = await prisma.department.findUnique({
            where: { name: departmentName }
        });

        if (!department) {
            console.warn(`[Timetable] Department "${departmentName}" not found in database. Returning empty entries.`);
            res.json([]);
            return;
        }

        const where: any = { departmentId: department.id };
        if (year) {
            where.year = year as Year;
        }
        if (facultyId) {
            where.facultyId = facultyId;
        }

        const entries = await prisma.timetable.findMany({
            where,
            orderBy: [{ day: 'asc' }, { periodIndex: 'asc' }]
        });

        res.json(entries);
    } catch (error) {
        console.error('Get timetable entries error:', error);
        res.status(500).json({ error: 'Failed to fetch timetable entries' });
    }
};

export const updateTimetableEntries = async (req: Request, res: Response): Promise<void> => {
    try {
        const { year, entries } = req.body; // entries: array of { day, periodIndex, subject, facultyId, facultyName }
        const departmentName = req.user?.department;

        if (!departmentName) {
            res.status(400).json({ error: 'Department not found for user' });
            return;
        }

        const department = await prisma.department.findUnique({
            where: { name: departmentName }
        });

        if (!department) {
            res.status(404).json({ error: 'Department not found in database' });
            return;
        }

        // Delete existing entries for this year and department to sync
        await prisma.timetable.deleteMany({
            where: {
                departmentId: department.id,
                year: year as Year
            }
        });

        // Create new entries
        if (entries && entries.length > 0) {
            const data = entries.map((entry: any) => ({
                departmentId: department.id,
                year: year as Year,
                day: entry.day,
                periodIndex: Number(entry.periodIndex),
                subject: entry.subject,
                facultyId: entry.facultyId === '_manual' ? null : entry.facultyId,
                facultyName: entry.facultyName,
                roomNumber: entry.roomNumber
            }));

            await prisma.timetable.createMany({
                data
            });
        }

        res.status(200).json({ message: 'Timetable updated successfully' });
    } catch (error) {
        console.error('Update timetable entries error:', error);
        res.status(500).json({ error: 'Failed to update timetable' });
    }
};
