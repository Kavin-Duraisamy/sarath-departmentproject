import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const results: string[] = [];
    try {
        const departments = await prisma.department.findMany();
        results.push('Departments in DB: ' + JSON.stringify(departments.map(d => d.name), null, 2));

        const staff = await prisma.user.findMany({
            where: { role: { in: ['FACULTY', 'HOD'] } },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                department: true
            }
        });
        results.push('Staff Users: ' + JSON.stringify(staff, null, 2));

    } catch (error: any) {
        results.push('Database check error: ' + error.message);
    } finally {
        fs.writeFileSync('db_check_result_staff.txt', results.join('\n'));
        await prisma.$disconnect();
    }
}

main();
