import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSettings);
router.post('/', authenticate, authorize('ADMIN'), updateSettings);

export default router;
