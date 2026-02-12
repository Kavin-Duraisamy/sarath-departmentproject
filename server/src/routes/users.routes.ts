import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (ADMIN, HOD)
router.get('/', authorize('ADMIN', 'HOD'), getUsers);

// Get single user
router.get('/:id', getUser);

// Create user (ADMIN, HOD)
router.post('/', authorize('ADMIN', 'HOD'), createUser);

// Update user (ADMIN)
router.put('/:id', authorize('ADMIN'), updateUser);

// Delete user (ADMIN)
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
