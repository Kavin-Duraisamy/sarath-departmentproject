import { Router } from 'express';
import {
    getTimetableSettings,
    updateTimetableSettings,
    getTimetableEntries,
    updateTimetableEntries
} from '../controllers/timetable.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// HOD only routes for updating settings and entries
router.get('/settings', authenticate, getTimetableSettings);
router.post('/settings', authenticate, authorize('hod'), updateTimetableSettings);

router.get('/entries', authenticate, getTimetableEntries);
router.post('/entries', authenticate, authorize('hod'), updateTimetableEntries);

export default router;
