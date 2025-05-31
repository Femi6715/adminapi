import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import ticketsRoutes from './tickets.routes';
import transactionsRoutes from './transactions.routes';

const router = Router();
const adminController = new AdminController();

// Public routes
router.post('/login', adminController.login.bind(adminController));

// Protected routes
router.get('/profile', authMiddleware, adminController.getProfile.bind(adminController));
router.get('/stats', authMiddleware, adminController.getStats.bind(adminController));
router.get('/users', authMiddleware, adminController.getUsers.bind(adminController));
router.delete('/users/:username', authMiddleware, adminController.deleteUser.bind(adminController));
router.put('/users/:username/ban', authMiddleware, adminController.banUser.bind(adminController));
router.put('/users/:username/unban', authMiddleware, adminController.unbanUser.bind(adminController));

// Mount tickets routes
console.log('Mounting tickets routes at /api/admin/tickets');
router.use('/tickets', authMiddleware, (req, res, next) => {
  console.log('Tickets route hit:', req.method, req.originalUrl);
  next();
}, ticketsRoutes);

// Mount transactions routes
console.log('Mounting transactions routes at /api/admin/transactions');
router.use('/transactions', authMiddleware, transactionsRoutes);

export default router; 