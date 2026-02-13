import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const missingDepartments = [
        'B.Sc Computer Science with Cognitive Systems',
        'bca'
    ];

    for (const name of missingDepartments) {
        try {
            // Generate a more unique code
            const code = name.split(' ').map(word => word[0]).join('').toUpperCase() + Math.floor(Math.random() * 100);

            await prisma.department.upsert({
                where: { name },
                update: {},
                create: {
                    name,
                    code
                }
            });
            console.log(`Ensured department exists: ${name} (Code: ${code})`);
        } catch (error: any) {
            console.error(`Error ensuring department ${name}:`, error.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
