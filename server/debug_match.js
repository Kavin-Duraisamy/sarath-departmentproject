
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Department Match ---');

    const users = await prisma.user.findMany({
        select: { name: true, role: true, department: true }
    });

    const nirmala = users.find(u => u.name === 'NIRMALA');
    const vpp = users.find(u => u.name === 'VISHNU PRIYA');

    if (nirmala && vpp) {
        console.log(`Nirmala Dept: [${nirmala.department}] (length: ${nirmala.department.length})`);
        console.log(`Vishnu Priya Dept: [${vpp.department}] (length: ${vpp.department.length})`);

        if (nirmala.department === vpp.department) {
            console.log('MATCH: Strings are exactly the same.');
        } else {
            console.log('MISMATCH: There is a difference in the strings.');
            // Check for common issues
            if (nirmala.department.trim() === vpp.department.trim()) {
                console.log('TRIM MATCH: One of them has leading/trailing spaces.');
            }
            if (nirmala.department.toLowerCase() === vpp.department.toLowerCase()) {
                console.log('CASE MISMATCH: Case differs.');
            }
        }
    } else {
        console.log('Could not find both users to compare.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
