// Server actions for Faculty Dashboard Stats
"use server";

import { auth } from "@/auth";

export type FacultyStats = {
    assignedClasses: number;
    totalStudents: number;
    pendingApprovals: number;
};

export async function getFacultyStats() {
    const session = await auth();
    if (!session?.user) {
        return {
            assignedClasses: 0,
            totalStudents: 0,
            pendingApprovals: 0,
        };
    }

    // Mock data - in real app, query Mongoose models
    // e.g. await ClassModel.countDocuments({ facultyId: session.user.id })
    const stats: FacultyStats = {
        assignedClasses: 3, // Mock value
        totalStudents: 120, // Mock value
        pendingApprovals: 5, // Mock value
    };

    return stats;
}
