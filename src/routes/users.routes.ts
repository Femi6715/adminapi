import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const adminController = new AdminController();

// Protected routes
router.get('/', authMiddleware, adminController.getUsers);
router.delete('/:username', authMiddleware, adminController.deleteUser);
router.post('/:username/ban', authMiddleware, adminController.banUser);
router.post('/:username/unban', authMiddleware, adminController.unbanUser);
router.put('/:username', authMiddleware, adminController.updateUser);

export default router; 