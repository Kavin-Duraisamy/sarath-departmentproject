
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    let report = '# Visibility Debug Report (Final Check)\n\n';

    // 1. All Users (Faculty/HOD/Admin)
    const users = await prisma.user.findMany();

    report += '## All Users in DB:\n';
    users.forEach(u => {
        report += `- **Name:** ${u.name}\n`;
        report += `  - **Username:** ${u.username}\n`;
        report += `  - **Email:** ${u.email}\n`;
        report += `  - **Role:** ${u.role}\n`;
        report += `  - **Department:** ${u.department}\n`;
        report += `  - **Assigned Years:** ${JSON.stringify(u.assignedYears)}\n\n`;
    });

    // 2. Student Count per Dept/Year
    const studentGroups = await prisma.student.groupBy({
        by: ['department', 'year'],
        _count: { id: true }
    });

    report += '## Student Distribution:\n';
    studentGroups.forEach(g => {
        report += `- **Dept:** ${g.department}, **Year:** ${g.year}, **Count:** ${g._count.id}\n`;
    });

    fs.writeFileSync('debug_report_final.md', report);
    console.log('Report written to debug_report_final.md');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
