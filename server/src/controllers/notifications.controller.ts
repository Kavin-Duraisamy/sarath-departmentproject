import { Request, Response } from 'express';
import prisma from '../config/database';
import { NotificationType, Role } from '@prisma/client';

// Get notifications for the logged-in user (Staff or Student)
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let where: any = {};
        if (role === 'STUDENT') {
            where = { studentId: userId };
        } else {
            where = { userId: userId };
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to latest 50
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params as { id: string };

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json(notification);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

// Bulk create notifications for target audience
export const createBulkNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, message, type, targetAudience } = req.body;
        const currentUser = req.user;

        if (!currentUser || currentUser.role !== Role.HOD) {
            res.status(403).json({ error: 'Only HODs can send announcements' });
            return;
        }

        // Map frontend types to Prisma NotificationType if needed
        const notificationType = (type.toUpperCase()) as NotificationType;

        let notificationsData: any[] = [];

        if (targetAudience === 'all') {
            const [users, students] = await Promise.all([
                prisma.user.findMany({ select: { id: true } }),
                prisma.student.findMany({ select: { id: true } })
            ]);
            notificationsData = [
                ...users.map(u => ({ title, message, type: notificationType, userId: u.id, senderId: currentUser.id, targetAudience })),
                ...students.map(s => ({ title, message, type: notificationType, studentId: s.id, senderId: currentUser.id, targetAudience }))
            ];
        } else if (targetAudience === 'students') {
            const students = await prisma.student.findMany({ select: { id: true } });
            notificationsData = students.map(s => ({ title, message, type: notificationType, studentId: s.id, senderId: currentUser.id, targetAudience }));
        } else if (targetAudience === 'faculty') {
            const users = await prisma.user.findMany({
                where: { role: Role.FACULTY },
                select: { id: true }
            });
            notificationsData = users.map(u => ({ title, message, type: notificationType, userId: u.id, senderId: currentUser.id, targetAudience }));
        } else if (targetAudience.startsWith('year')) {
            const year = targetAudience.replace('year', '');
            const students = await prisma.student.findMany({
                where: { year },
                select: { id: true }
            });
            notificationsData = students.map(s => ({ title, message, type: notificationType, studentId: s.id, senderId: currentUser.id, targetAudience }));
        } else if (targetAudience.startsWith('user:')) {
            const userId = targetAudience.replace('user:', '');
            notificationsData = [{ title, message, type: notificationType, userId, senderId: currentUser.id, targetAudience }];
        } else if (targetAudience.startsWith('student:')) {
            const studentId = targetAudience.replace('student:', '');
            notificationsData = [{ title, message, type: notificationType, studentId, senderId: currentUser.id, targetAudience }];
        }

        if (notificationsData.length > 0) {
            await prisma.notification.createMany({
                data: notificationsData
            });
        }

        res.status(201).json({ message: `Sent ${notificationsData.length} notifications` });
    } catch (error) {
        console.error('Bulk create notifications error:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
};

// Get notifications sent BY the logged-in HOD
export const getSentNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;

        if (!userId || role !== Role.HOD) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        const notifications = await prisma.notification.findMany({
            where: { senderId: userId },
            orderBy: { createdAt: 'desc' },
            distinct: ['title', 'createdAt'], // Crude way to get unique broadcasts
            take: 50
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get sent notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch sent notifications' });
    }
};

// Internal helper to create notifications (can be exported if needed)
export const createNotification = async (data: {
    title: string;
    message: string;
    type: NotificationType;
    userId?: string;
    studentId?: string;
}) => {
    try {
        return await prisma.notification.create({
            data
        });
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};
