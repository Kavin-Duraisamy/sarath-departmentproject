
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Simulating getUsers for HOD NIRMALA ---');

    const nirmala = await prisma.user.findFirst({
        where: { name: 'NIRMALA' }
    });

    if (!nirmala) {
        console.log('NIRMALA not found.');
        return;
    }

    console.log(`HOD: ${nirmala.name}, Role: ${nirmala.role}, Dept: [${nirmala.department}]`);

    const currentUser = {
        id: nirmala.id,
        username: nirmala.username,
        role: nirmala.role,
        department: nirmala.department
    };

    let where = {};
    // Simulate the controller logic
    if (currentUser.role === 'HOD' && currentUser.department) {
        where = { department: currentUser.department };
        console.log(`Filtering where department = [${currentUser.department}]`);
    }

    const users = await prisma.user.findMany({
        where,
        select: { name: true, role: true, department: true }
    });

    console.log(`Found ${users.length} total users in this department.`);
    const faculty = users.filter(u => u.role === 'FACULTY');
    console.log(`Found ${faculty.length} faculty in this department.`);

    users.forEach(u => {
        console.log(`- ${u.name} (Role: ${u.role}, Dept: ${u.department})`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
