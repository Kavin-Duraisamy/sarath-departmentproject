
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    let report = '# Project Guide Debug Report\n\n';

    // 1. Student Info
    const student = await prisma.student.findFirst({
        where: {
            OR: [
                { rollNumber: '231CG048' },
                { rollNumber: '231cg048' }
            ]
        },
        include: { projects: true }
    });

    if (!student) {
        report += '## Student: Not Found\n';
    } else {
        report += `## Student: ${student.name} (${student.rollNumber})\n`;
        report += '### Projects:\n';
        student.projects.forEach(p => {
            report += `- **Title:** ${p.title}\n`;
            report += `  - **Type:** ${p.type}\n`;
            report += `  - **Status:** ${p.status}\n`;
            report += `  - **Guide Name (stored):** ${p.guideName}\n`;
            report += `  - **Guide Email (stored):** ${p.guideEmail}\n`;
            report += `  - **Role (stored):** ${p.guideRole}\n\n`;
        });
    }

    // 2. Faculty Info
    const faculty = await prisma.user.findMany({
        where: {
            role: { in: ['FACULTY', 'HOD'] }
        }
    });

    report += '## Faculty Users in DB:\n';
    faculty.forEach(f => {
        report += `- **Name:** ${f.name}\n`;
        report += `  - **Username:** ${f.username}\n`;
        report += `  - **Email:** ${f.email}\n`;
        report += `  - **Role:** ${f.role}\n\n`;
    });

    fs.writeFileSync('debug_report.md', report);
    console.log('Report written to debug_report.md');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
