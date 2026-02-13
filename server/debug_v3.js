
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    let report = '# Project Guide & HOD Debug Report (v3)\n\n';

    // 1. Student Info
    const students = await prisma.student.findMany({
        include: { projects: true }
    });

    report += '## Students & Projects:\n';
    students.forEach(student => {
        if (student.projects.length > 0) {
            report += `### ${student.name} (${student.rollNumber}) - Dept: ${student.department}\n`;
            student.projects.forEach(p => {
                report += `- **Title:** ${p.title}\n`;
                report += `  - **Type:** ${p.type}\n`;
                report += `  - **Status:** ${p.status}\n`;
                report += `  - **Guide Email (stored):** ${p.guideEmail}\n\n`;
            });
        }
    });

    // 2. All Users (Faculty/HOD/Admin)
    const users = await prisma.user.findMany();

    report += '## All Users in DB:\n';
    users.forEach(u => {
        report += `- **Name:** ${u.name}\n`;
        report += `  - **Username:** ${u.username}\n`;
        report += `  - **Email:** ${u.email}\n`;
        report += `  - **Role:** ${u.role}\n`;
        report += `  - **Department:** ${u.department}\n\n`;
    });

    fs.writeFileSync('debug_report_v3.md', report);
    console.log('Report written to debug_report_v3.md');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
