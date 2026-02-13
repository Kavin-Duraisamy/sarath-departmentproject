
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const hashedPassword = await bcrypt.hash('nirmala', 10);

        const user = await prisma.user.update({
            where: { username: 'nirmala' },
            data: { password: hashedPassword }
        });

        console.log("Password reset successful for:", user.username);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
