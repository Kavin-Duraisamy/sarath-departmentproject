import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword(username, newPassword) {
    console.log(`Updating password for user: ${username}`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
        where: { username: username },
        data: { password: hashedPassword }
    });

    console.log('✅ Password updated successfully for:', user.username);
}

async function main() {
    await updatePassword('nirmala', 'hodcog');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
