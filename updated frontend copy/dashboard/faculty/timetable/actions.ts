import { auth } from "@/auth";

export type TimetableSettings = {
    startTime: string;
    periodDuration: number;
    periodsPerDay: number;
    breakAfterPeriod: number;
    breakDuration: number;
};

export type TimetableData = Record<string, Record<string, Record<number, { subject: string; year: string; facultyName: string }>>>;

export async function getFacultyTimetable() {
    "use server";
    const session = await auth();
    if (!session?.user) {
        return { settings: null, timetable: null };
    }
    // Mock settings - could be stored in DB per faculty
    const settings: TimetableSettings = {
        startTime: "08:30",
        periodDuration: 55,
        periodsPerDay: 5,
        breakAfterPeriod: 2,
        breakDuration: 25,
    };

    // Mock timetable data - in real app fetch from DB
    const mockTimetable: TimetableData = {
        I: {
            Monday: {
                1: { subject: "Math", year: "I", facultyName: session.user.name || "Faculty" },
                2: { subject: "Physics", year: "I", facultyName: session.user.name || "Faculty" },
            },
        },
        // Add more as needed
    };

    return { settings, timetable: mockTimetable };
}
