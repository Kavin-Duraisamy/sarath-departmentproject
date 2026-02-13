
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany();
        console.log("Total users:", users.length);
        console.log("Users:", JSON.stringify(users, null, 2));

        const nirmala = await prisma.user.findFirst({
            where: { username: { equals: 'nirmala', mode: 'insensitive' } },
            select: { id: true, username: true, assignedYears: true }
        });
        console.log("Nirmala user:", nirmala);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
