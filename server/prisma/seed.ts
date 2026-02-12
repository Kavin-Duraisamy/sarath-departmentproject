import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create demo admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@college.edu',
            password: adminPassword,
            name: 'System Admin',
            role: 'ADMIN',
        },
    });
    console.log('✅ Created admin user: admin');

    // Create demo common HOD user (Can manage all departments)
    const commonHodPassword = await bcrypt.hash('hod123', 10);
    await prisma.user.upsert({
        where: { username: 'hod' },
        update: {},
        create: {
            username: 'hod',
            email: 'hod@college.edu',
            password: commonHodPassword,
            name: 'Common HOD',
            role: 'HOD',
            department: null, // Null department means can manage all
        },
    });
    console.log('✅ Created common HOD user: hod');

    // Create demo departmental HOD user
    const deptHodPassword = await bcrypt.hash('nirmala', 10);
    const hod = await prisma.user.upsert({
        where: { username: 'nirmala' },
        update: {},
        create: {
            username: 'nirmala',
            email: 'nirmalaseetharaman@gmail.com',
            password: deptHodPassword,
            name: 'NIRMALA S',
            role: 'HOD',
            department: 'B.Sc Computer Science',
        },
    });
    console.log('✅ Created departmental HOD user:', hod.username);

    // Create demo placement officer
    const placementPassword = await bcrypt.hash('placement123', 10);
    await prisma.user.upsert({
        where: { username: 'placement' },
        update: {},
        create: {
            username: 'placement',
            email: 'placement@college.edu',
            password: placementPassword,
            name: 'Placement Officer',
            role: 'PLACEMENT',
        },
    });
    console.log('✅ Created placement user: placement');

    // Create demo faculty user
    const facultyPassword = await bcrypt.hash('vp', 10);
    await prisma.user.upsert({
        where: { username: 'vp' },
        update: {},
        create: {
            username: 'vp',
            email: 'vp@college.edu',
            password: facultyPassword,
            name: 'VP Faculty',
            role: 'FACULTY',
            department: 'B.Sc Computer Science',
        },
    });
    console.log('✅ Created departmental faculty user: vp');

    // Create demo student
    const studentPassword = await bcrypt.hash('2005-01-01', 10);
    await prisma.student.upsert({
        where: { rollNumber: 'AI2023001' },
        update: {},
        create: {
            rollNumber: 'AI2023001',
            name: 'Demo Student',
            email: 'student@college.edu',
            phone: '9876543210',
            year: 'I',
            department: 'B.Sc Computer Science',
            batch: '2023-2026',
            dob: '2005-01-01',
            password: studentPassword,
        },
    });
    console.log('✅ Created demo student: AI2023001');

    // Create departments
    const departments = [
        { name: 'B.Sc Computer Science', code: 'CS', hodName: 'NIRMALA S' },
        { name: 'AI & Data Science', code: 'AI', hodName: '' },
        { name: 'Commerce', code: 'COM', hodName: '' },
        { name: 'Mathematics', code: 'MATH', hodName: '' },
    ];

    for (const dept of departments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: {},
            create: dept,
        });
    }
    console.log('✅ Created departments');

    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
