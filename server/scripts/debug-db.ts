import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Users:');
    const users = await prisma.user.findMany();
    users.forEach(u => {
        console.log(`- Username: ${u.username}, Role: ${u.role}, HashedPassword: ${u.password.substring(0, 10)}...`);
    });

    console.log('\nChecking Students:');
    const students = await prisma.student.findMany();
    students.forEach(s => {
        console.log(`- Roll: ${s.rollNumber}, Password (hashed DOB): ${s.password.substring(0, 10)}...`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
