import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';

// Get all students (filtered by department for HOD)
export const getStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { year, search, type, department } = req.query;
        const userRole = req.user?.role;
        const userDepartment = req.user?.department;

        const where: any = {
            isAlumni: type === 'alumni'
        };

        // Enforce department for HOD/FACULTY, allow filter for ADMIN
        if ((userRole === 'HOD' || userRole === 'FACULTY') && userDepartment) {
            where.department = userDepartment;
        } else if (department) {
            where.department = department;
        }

        // Filter by assignedYears for FACULTY
        if (userRole === 'FACULTY' && userDepartment) {
            where.department = userDepartment;

            // Get faculty's assigned years
            const faculty = await prisma.user.findUnique({
                where: { id: req.user?.id },
                select: { assignedYears: true }
            });

            if (faculty?.assignedYears && faculty.assignedYears.length > 0) {
                where.year = { in: faculty.assignedYears };
            }
        }

        // Filter by year if provided (overrides assignedYears if more specific)
        if (year && year !== 'all') {
            where.year = year;
        }

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { rollNumber: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const students = await prisma.student.findMany({
            where,
            select: {
                id: true,
                rollNumber: true,
                name: true,
                email: true,
                phone: true,
                year: true,
                department: true,
                batch: true,
                dob: true,
                profilePic: true,
                fatherName: true,
                fatherPhone: true,
                motherName: true,
                motherPhone: true,
                guardianName: true,
                guardianPhone: true,
                passedOutYear: true,
                updatedAt: true,
            },
            orderBy: { rollNumber: 'asc' },
        });

        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single student
export const getStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const student = await prisma.student.findUnique({
            where: { id: id as string },
            include: {
                academicRecords: true,
                internships: true,
                resumes: true,
                certificates: true,
                projects: {
                    include: {
                        history: {
                            orderBy: {
                                createdAt: 'desc'
                            }
                        }
                    }
                },
            },
        });

        if (!student) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        res.json(student);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create student
export const createStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let { name, rollNumber, email, phone, year, department, batch, dob } = req.body;

        // Validate required fields
        if (!name || !rollNumber || !email || !year || !department || !batch || !dob) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // RBAC enforcement: Department HOD can ONLY create students for their department
        if (currentUser.role === 'HOD' && currentUser.department) {
            department = currentUser.department;
        }

        // Check for existing student (case-insensitive roll number or email)
        const existingStudent = await prisma.student.findFirst({
            where: {
                OR: [
                    { rollNumber: { equals: rollNumber, mode: 'insensitive' } },
                    { email: { equals: email, mode: 'insensitive' } }
                ]
            }
        });

        if (existingStudent) {
            res.status(409).json({ error: 'Student with this roll number or email already exists' });
            return;
        }

        // Hash the DOB as password
        const hashedPassword = await bcrypt.hash(dob, 10);

        const student = await prisma.student.create({
            data: {
                name,
                rollNumber: rollNumber.toUpperCase(), // Ensure uppercase
                email: email.toLowerCase(),
                phone: phone || '',
                year,
                department,
                batch,
                dob,
                password: hashedPassword,
            },
        });

        res.status(201).json(student);
    } catch (error: any) {
        console.error('Create student error:', error);

        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Student with this roll number or email already exists' });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};

// Bulk create students
export const bulkCreateStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            res.status(400).json({ error: 'Invalid students data' });
            return;
        }

        // RBAC enforcement: Department HOD can ONLY create students for their department
        const departmentRestricted = currentUser.role === 'HOD' && currentUser.department;

        // Hash passwords and enforce department for all students
        const studentsWithHashedPasswords = await Promise.all(
            students.map(async (student) => ({
                ...student,
                department: departmentRestricted ? currentUser.department : student.department,
                password: await bcrypt.hash(student.dob, 10),
            }))
        );

        const result = await prisma.student.createMany({
            data: studentsWithHashedPasswords,
            skipDuplicates: true,
        });

        res.status(201).json({
            message: `Successfully created ${result.count} students`,
            count: result.count
        });
    } catch (error) {
        console.error('Bulk create students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update student
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const currentUser = req.user;

        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Don't allow updating password or rollNumber directly
        delete updateData.password;
        delete updateData.rollNumber;

        // If HOD is restricted to a department, ensure they only update their students
        const where: any = { id };
        if (currentUser.role === 'HOD' && currentUser.department) {
            where.department = currentUser.department;
        }

        // First find the student to ensure they exist and match the department
        const studentToUpdate = await prisma.student.findFirst({
            where: { ...where, id: id as string },
        });

        if (!studentToUpdate) {
            res.status(404).json({ error: 'Student not found or unauthorized' });
            return;
        }

        const student = await prisma.student.update({
            where: { id: id as string },
            data: updateData,
        });

        res.json(student);
    } catch (error: any) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const currentUser = req.user;
        console.log(`[DELETE] deleteStudent called for ID: ${id}`);

        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const where: any = { id };
        if (currentUser.role === 'HOD' && currentUser.department) {
            where.department = currentUser.department;
        }

        const result = await prisma.student.deleteMany({
            where: { ...where, id: id as string },
        });

        if (result.count === 0) {
            res.status(404).json({ error: 'Student not found or unauthorized' });
            return;
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error: any) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Bulk delete students (all in department for HOD, or filtered if needed)
export const bulkDeleteStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('[DELETE] bulkDeleteStudents called');
        const currentUser = req.user;
        const { ids } = req.body; // Optional: If provided, delete only these IDs

        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const where: any = {};

        // RBAC: HOD can only delete their own department's students
        if (currentUser.role === 'HOD' && currentUser.department) {
            where.department = currentUser.department;
        } else if (currentUser.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
            return;
        }

        // If specific IDs are provided, filter by them
        if (ids && Array.isArray(ids) && ids.length > 0) {
            where.id = { in: ids };
        }

        const result = await prisma.student.deleteMany({
            where,
        });

        res.json({
            message: `Successfully deleted ${result.count} students`,
            count: result.count
        });
    } catch (error) {
        console.error('Bulk delete students error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update student profile
export const updateStudentProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { profilePic, address, bloodGroup, fatherName, fatherPhone, motherName, motherPhone, guardianName, guardianPhone, skills, communicationCategory } = req.body;

        // Log to file for debugging
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../../debug_updates.log');
        const logEntry = `[${new Date().toISOString()}] ID: ${id}, Body: ${JSON.stringify(req.body)}\n`;
        fs.appendFileSync(logPath, logEntry);

        const student = await prisma.student.update({
            where: { id: id as string },
            data: {
                profilePic,
                address,
                bloodGroup,
                fatherName,
                fatherPhone,
                motherName,
                motherPhone,
                guardianName,
                guardianPhone,
                skills,
                communicationCategory,
            },
        });

        res.json(student);
    } catch (error: any) {
        console.error('Update student profile error:', error);

        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Asset Management ---

// Add Resume
export const addResume = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { name, fileUrl } = req.body;

        const resume = await prisma.resume.create({
            data: {
                studentId: id,
                title: name,
                fileUrl,
            },
        });
        res.json(resume);
    } catch (error) {
        console.error('Add resume error:', error);
        res.status(500).json({ error: 'Failed to add resume' });
    }
};

// Delete Resume
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
    try {
        const resumeId = req.params.resumeId as string;
        await prisma.resume.delete({ where: { id: resumeId } });
        res.json({ message: 'Resume deleted' });
    } catch (error) {
        console.error('Delete resume error:', error);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
};

// Add Project (Internship or Final Year)
export const addProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { title, description, technologies, guide, guideEmail, duration, type, status, githubUrl, liveUrl, remarks, approvedAt } = req.body;

        const project = await prisma.project.create({
            data: {
                studentId: id,
                title,
                description,
                // @ts-ignore
                technologies,
                guideName: guide,
                guideEmail,
                duration,
                type,
                status: status || 'pending',
                githubUrl,
                liveUrl,
                remarks,
                approvedAt,
                history: {
                    create: {
                        status: status || 'pending',
                        remarks: 'Project submitted',
                        actionBy: req.user?.name || 'Student'
                    }
                }
            },
        });
        res.json(project);
    } catch (error) {
        console.error('Add project error:', error);
        res.status(500).json({ error: 'Failed to add project' });
    }
};

// Update Project Status (Approve/Reject)
export const updateProjectStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const projectId = req.params.projectId as string;
        const { status, remarks } = req.body;

        const updateData: any = { status, remarks };

        if (status === 'approved') {
            updateData.approvedAt = new Date();
            if (req.user?.name) {
                updateData.approvedBy = req.user.name;
            }
        }

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...updateData,
                history: {
                    create: {
                        status: status,
                        remarks: remarks || (status === 'approved' ? 'Approved' : 'Rejected'),
                        actionBy: req.user?.name || 'Faculty'
                    }
                }
            }
        });
        res.json(project);
    } catch (error) {
        console.error('Update project status error:', error);
        res.status(500).json({ error: 'Failed to update project status' });
    }
};

// Get Projects for Faculty (Guides)
export const getFacultyProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Find projects where the guideEmail matches the current user's email or username
        // We check both because sometimes guideEmail might be stored as username or generic email
        console.log(`[getFacultyProjects] Looking for projects for email: "${currentUser.email}" or username: "${currentUser.username}"`);

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { guideEmail: currentUser.email },
                    { guideEmail: currentUser.username }
                ]
            },
            include: {
                student: {
                    select: {
                        name: true,
                        rollNumber: true,
                        year: true,
                        department: true // Helpful context
                    }
                },
                faculty: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                history: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`[getFacultyProjects] Found ${projects.length} projects`);
        res.json(projects);
    } catch (error) {
        console.error('Get faculty projects error:', error);
        res.status(500).json({ error: 'Failed to fetch faculty projects' });
    }
};

export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const currentUser = req.user;
        if (!currentUser) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let where = {};
        // If HOD, filter by department
        if (currentUser.role === 'HOD' && currentUser.department) {
            where = {
                student: {
                    department: currentUser.department
                }
            };
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                student: {
                    select: {
                        name: true,
                        rollNumber: true,
                        year: true,
                        department: true
                    }
                },
                faculty: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                history: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        console.error('Get all projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// Delete Project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const projectId = req.params.projectId as string;
        await prisma.project.delete({ where: { id: projectId } });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

// Add Certificate
export const addCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { name, issuedBy, issueDate, fileUrl } = req.body;

        const certificate = await prisma.certificate.create({
            data: {
                studentId: id,
                title: name,
                issuer: issuedBy,
                issuedDate: issueDate,
                fileUrl,
            },
        });
        res.json(certificate);
    } catch (error) {
        console.error('Add certificate error:', error);
        res.status(500).json({ error: 'Failed to add certificate' });
    }
};

// Delete Certificate
export const deleteCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
        const certId = req.params.certId as string;
        await prisma.certificate.delete({ where: { id: certId } });
        res.json({ message: 'Certificate deleted' });
    } catch (error) {
        console.error('Delete certificate error:', error);
        res.status(500).json({ error: 'Failed to delete certificate' });
    }
};

// Add Internship
export const addInternship = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { company, role, duration, description, certificateUrl } = req.body;

        const internship = await prisma.internship.create({
            data: {
                studentId: id,
                company,
                role,
                duration,
                description,
                certificate: certificateUrl,
            },
        });
        res.json(internship);
    } catch (error) {
        console.error('Add internship error:', error);
        res.status(500).json({ error: 'Failed to add internship' });
    }
};

// Delete Internship
export const deleteInternship = async (req: Request, res: Response): Promise<void> => {
    try {
        const internshipId = req.params.internshipId as string;
        await prisma.internship.delete({ where: { id: internshipId } });
        res.json({ message: 'Internship deleted' });
    } catch (error) {
        console.error('Delete internship error:', error);
        res.status(500).json({ error: 'Failed to delete internship' });
    }
};

// Upsert Academics (Update all semesters)
export const upsertAcademics = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { semesters } = req.body;

        // Use transaction to update/create all
        await prisma.$transaction(async (tx) => {
            if (semesters && Array.isArray(semesters)) {
                for (const sem of semesters) {
                    const existing = await tx.academicRecord.findFirst({
                        where: { studentId: id, semester: sem.semester },
                    });

                    if (existing) {
                        await tx.academicRecord.update({
                            where: { id: existing.id },
                            data: {
                                // @ts-ignore
                                sgpa: parseFloat(sem.sgpa) || 0,
                                // @ts-ignore
                                arrears: parseInt(sem.arrears) || 0,
                            },
                        });
                    } else {
                        await tx.academicRecord.create({
                            data: {
                                studentId: id,
                                semester: sem.semester,
                                // @ts-ignore
                                sgpa: parseFloat(sem.sgpa) || 0,
                                // @ts-ignore
                                arrears: parseInt(sem.arrears) || 0,
                                subjects: '[]',
                            },
                        });
                    }
                }
            }
        });

        res.json({ message: 'Academics updated successfully' });
    } catch (error) {
        console.error('Upsert academics error:', error);
        res.status(500).json({ error: 'Failed to update academics' });
    }
};

// Get Academics
export const getAcademics = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const records = await prisma.academicRecord.findMany({
            where: { studentId: id },
            orderBy: { semester: 'asc' },
        });
        res.json(records);
    } catch (error) {
        console.error('Get academics error:', error);
        res.status(500).json({ error: 'Failed to fetch academics' });
    }
};
// Reset Student Password (to DOB)
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        if (!currentUser || (currentUser.role !== 'HOD' && currentUser.role !== 'ADMIN')) {
            res.status(403).json({ error: 'Unauthorized: Only HOD or Admin can reset passwords' });
            return;
        }

        const student = await prisma.student.findUnique({
            where: { id: id as string },
            select: { dob: true, department: true }
        });

        if (!student) {
            res.status(404).json({ error: 'Student not found' });
            return;
        }

        // RBAC: HOD can only reset passwords for their department
        if (currentUser.role === 'HOD' && currentUser.department && student.department !== currentUser.department) {
            res.status(403).json({ error: 'Unauthorized: You can only reset passwords for your department' });
            return;
        }

        const hashedPassword = await bcrypt.hash(student.dob, 10);

        await prisma.student.update({
            where: { id: id as string },
            data: { password: hashedPassword }
        });

        res.json({ message: `Password reset successfully to DOB: ${student.dob}` });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
