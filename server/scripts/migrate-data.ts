import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface StaffUser {
    id: string;
    username: string;
    password: string;
    name: string;
    role: string;
    department?: string;
    email?: string;
}

async function migrateStaffUsers() {
    console.log('📦 Migrating staff users from JSON...');

    const jsonPath = path.join(process.cwd(), '..', 'public', 'staff-users.json');

    if (!fs.existsSync(jsonPath)) {
        console.log('⚠️  No staff-users.json found, skipping migration');
        return;
    }

    const data = fs.readFileSync(jsonPath, 'utf-8');
    const staffUsers: StaffUser[] = JSON.parse(data);

    let migratedCount = 0;

    for (const user of staffUsers) {
        try {
            // Hash the password if it's not already hashed
            const hashedPassword = user.password.startsWith('$2')
                ? user.password
                : await bcrypt.hash(user.password, 10);

            await prisma.user.upsert({
                where: { username: user.username },
                update: {},
                create: {
                    username: user.username,
                    email: user.email || null,
                    password: hashedPassword,
                    name: user.name,
                    role: user.role.toUpperCase() as any,
                    department: user.department || null,
                },
            });

            migratedCount++;
            console.log(`✅ Migrated user: ${user.username}`);
        } catch (error) {
            console.error(`❌ Failed to migrate user ${user.username}:`, error);
        }
    }

    console.log(`🎉 Migrated ${migratedCount} staff users`);
}

async function main() {
    console.log('🚀 Starting data migration...\n');

    await migrateStaffUsers();

    console.log('\n✨ Migration completed!');
}

main()
    .catch((e) => {
        console.error('❌ Migration error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
