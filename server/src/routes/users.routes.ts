import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (ADMIN, HOD)
router.get('/', authorize('ADMIN', 'HOD', 'FACULTY', 'STUDENT'), getUsers);

// Get single user
router.get('/:id', getUser);

// Create user (ADMIN, HOD)
router.post('/', authorize('ADMIN', 'HOD'), createUser);

// Update user (ADMIN, HOD)
router.put('/:id', authorize('ADMIN', 'HOD'), updateUser);

// Delete user (ADMIN, HOD)
router.delete('/:id', authorize('ADMIN', 'HOD'), deleteUser);

export default router;
