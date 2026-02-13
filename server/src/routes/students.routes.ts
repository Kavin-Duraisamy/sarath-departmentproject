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
    updateProjectStatus,
    getFacultyProjects,
    getAllProjects,
    resetPassword
} from '../controllers/students.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Bulk routes first
router.post('/bulk', authorize('HOD', 'ADMIN'), bulkCreateStudents);
router.delete('/bulk-delete', authorize('HOD', 'ADMIN'), bulkDeleteStudents);

// Project faculty route
router.get('/projects/faculty', getFacultyProjects);

// Get all projects (for HOD/ADMIN)
router.get('/projects/all', getAllProjects);

// Profile
router.get('/profile/me', (req, _res, next) => {
    // Controller logic to get current student profile
    // We can reuse getStudent if we pass req.user.id
    req.params.id = req.user?.id as string;
    next();
}, getStudent);

// Dynamic routes last
router.get('/', getStudents);
router.get('/:id', getStudent);
router.post('/', authorize('HOD', 'ADMIN'), createStudent);
router.put('/:id', updateStudent);

// Resumes
router.post('/:id/resumes', addResume);
router.delete('/:id/resumes/:resumeId', deleteResume);

// Projects
router.post('/:id/projects', addProject);
router.delete('/:id/projects/:projectId', deleteProject);
router.put('/:id/projects/:projectId/status', updateProjectStatus);

// Certificates
router.post('/:id/certificates', addCertificate);
router.delete('/:id/certificates/:certId', deleteCertificate);

// Internships
router.post('/:id/internships', addInternship);
router.delete('/:id/internships/:internshipId', deleteInternship);

// Academics
router.post('/:id/academics', upsertAcademics);
router.get('/:id/academics', getAcademics);

// Profile
router.put('/:id/profile', updateStudentProfile);

router.delete('/:id', authorize('HOD', 'ADMIN'), deleteStudent);

router.post('/:id/reset-password', authenticate, resetPassword);

export default router;
