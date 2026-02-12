
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking student data for parent fields...');

    try {
        // Get the first few students
        const students = await prisma.student.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                rollNumber: true,
                fatherName: true,
                fatherPhone: true,
                motherName: true,
                motherPhone: true,
            }
        });

        console.log('Found students:', students);

        // Check if we can update one
        if (students.length > 0) {
            const testStudent = students[0];
            console.log(`\nAttempting to update student ${testStudent.name} (${testStudent.rollNumber})...`);

            const updated = await prisma.student.update({
                where: { id: testStudent.id },
                data: {
                    fatherPhone: "9999999999", // Test value
                    motherPhone: "8888888888"
                }
            });
            console.log('Update successful. New data:', updated);

            // Revert it
            await prisma.student.update({
                where: { id: testStudent.id },
                data: {
                    fatherPhone: testStudent.fatherPhone,
                    motherPhone: testStudent.motherPhone
                }
            });
            console.log('Reverted changes.');
        }

    } catch (error) {
        console.error('Error checking DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
