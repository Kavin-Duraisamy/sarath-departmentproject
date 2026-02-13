import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const results: string[] = [];
    try {
        const users = await prisma.user.findMany({ take: 1 });
        results.push('Database connection successful');
        if (users.length > 0) {
            results.push('User sample: ' + JSON.stringify(users[0], null, 2));
            if ('subjects' in users[0]) {
                results.push('Column "subjects" exists');
            } else {
                results.push('Column "subjects" DOES NOT exist');
            }
        } else {
            results.push('No users found to check columns');
        }
    } catch (error: any) {
        results.push('Database check error: ' + error.message);
    } finally {
        fs.writeFileSync('db_check_result.txt', results.join('\n'));
        await prisma.$disconnect();
    }
}

main();
