import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const adminController = new AdminController();

// Public routes
router.post('/login', adminController.login);

// Protected routes
router.get('/me', authMiddleware, adminController.getProfile);

export default router; 