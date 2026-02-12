import { Router } from 'express';
import {
    getStudents,
    getStudent,
    createStudent,
    bulkCreateStudents,
    updateStudent,
    deleteStudent,
    bulkDeleteStudents,
    updateStudentProfile,
    addResume,
    deleteResume,
    addProject,
    deleteProject,
    addCertificate,
    deleteCertificate,
    addInternship,
    deleteInternship,
    upsertAcademics,
    getAcademics,
} from '../controllers/students.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all students (HOD sees only their department)
router.get('/', getStudents);

// Get single student
router.get('/:id', getStudent);

// Create student (HOD, ADMIN)
router.post('/', authorize('HOD', 'ADMIN'), createStudent);

// Bulk create students (HOD, ADMIN)
router.post('/bulk', authorize('HOD', 'ADMIN'), bulkCreateStudents);

// Update student (HOD, ADMIN, STUDENT can update own)
router.put('/:id', updateStudent);

// --- Asset Routes ---

// Resumes
router.post('/:id/resumes', addResume);
router.delete('/:id/resumes/:resumeId', deleteResume);

// Projects
router.post('/:id/projects', addProject);
router.delete('/:id/projects/:projectId', deleteProject);

// Certificates
router.post('/:id/certificates', addCertificate);
router.delete('/:id/certificates/:certId', deleteCertificate);

// Internships
router.post('/:id/internships', addInternship);
router.delete('/:id/internships/:internshipId', deleteInternship);

// Academics
router.post('/:id/academics', upsertAcademics);
router.get('/:id/academics', getAcademics);

// Update student profile
router.put('/:id/profile', updateStudentProfile);

// Bulk delete students (HOD, ADMIN)
router.delete('/bulk-delete', authorize('HOD', 'ADMIN'), bulkDeleteStudents);

// Delete student (HOD, ADMIN)
router.delete('/:id', authorize('HOD', 'ADMIN'), deleteStudent);

export default router;
