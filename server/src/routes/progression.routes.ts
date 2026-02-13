
import express from 'express';
import { getProgressionHistory, previewProgression, promoteBatch, rollbackProgression } from '../controllers/progression.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require HOD authentication
router.use(authenticate);
router.use(authorize('HOD', 'ADMIN'));

router.get('/history', getProgressionHistory);
router.get('/preview', previewProgression);
router.post('/promote', promoteBatch);
router.post('/rollback/:id', rollbackProgression);

export default router;
