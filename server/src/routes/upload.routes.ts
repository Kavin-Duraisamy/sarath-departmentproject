import { Router } from 'express';
import {
    uploadResume,
    uploadCertificate,
    uploadProfilePhoto,
    uploadDocument,
    upload,
} from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload routes
router.post('/resume', upload.single('file'), uploadResume);
router.post('/certificate', upload.single('file'), uploadCertificate);
router.post('/profile-photo', upload.single('file'), uploadProfilePhoto);
router.post('/document', upload.single('file'), uploadDocument);

export default router;
