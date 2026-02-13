import { Router } from 'express';
import { getDepartments, createDepartment, deleteDepartment, getSystemStats } from '../controllers/departments.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getDepartments);
router.get('/stats', authenticate, authorize('ADMIN'), getSystemStats);
router.post('/', authenticate, authorize('ADMIN'), createDepartment);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteDepartment);

export default router;
