// Server actions for Faculty Notifications
"use server";

import { auth } from "@/auth";

export type Notification = {
    id: string;
    type: "announcement" | "project" | "system";
    title: string;
    message: string;
    date: string;
    read: boolean;
};

export async function getNotifications() {
    const session = await auth();
    if (!session?.user) return [];

    // Mock notifications - in real app fetch from DB based on session.user.id
    const notifications: Notification[] = [
        {
            id: "1",
            type: "announcement",
            title: "Department Meeting Scheduled",
            message: "Faculty meeting scheduled for next Monday at 10 AM in Conference Room A",
            date: "2024-01-15",
            read: false,
        },
        {
            id: "2",
            type: "project",
            title: "New Project Submission",
            message: "Student John Doe has submitted final year project for review",
            date: "2024-01-14",
            read: false,
        },
        {
            id: "3",
            type: "system",
            title: "Timetable Updated",
            message: "Your teaching schedule has been updated for next semester",
            date: "2024-01-13",
            read: true,
        },
    ];

    return notifications;
}
