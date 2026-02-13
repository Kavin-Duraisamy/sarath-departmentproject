import { Router } from 'express';
import {
    getCompanies,
    createCompany,
    updateCompany,
    applyForCompany,
    getAllApplications,
    updateApplicationStatus,
    getPlacementStats
} from '../controllers/placement.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Publicly accessible for logged in users (Students, Faculty, HOD, Placement)
router.get('/companies', authenticate, getCompanies);
router.get('/stats', authenticate, getPlacementStats);

// Placement Officer only routes
router.post('/companies', authenticate, authorize('PLACEMENT', 'ADMIN'), createCompany);
router.put('/companies/:id', authenticate, authorize('PLACEMENT', 'ADMIN'), updateCompany);

// Application routes
router.get('/applications', authenticate, authorize('PLACEMENT', 'ADMIN', 'HOD'), getAllApplications);
router.post('/apply/:companyId', authenticate, authorize('STUDENT'), applyForCompany);
router.put('/applications/:id', authenticate, authorize('PLACEMENT', 'ADMIN'), updateApplicationStatus);

export default router;
