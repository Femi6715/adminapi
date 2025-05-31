import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { TransactionsController } from '../controllers/transactions.controller';
import { TicketsController } from '../controllers/tickets.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();
const transactionsController = new TransactionsController();
const ticketsController = new TicketsController();

// Public routes
router.post('/login', adminController.login.bind(adminController));

// Protected routes
router.get('/profile', authMiddleware, adminController.getProfile.bind(adminController));
router.get('/stats', authMiddleware, adminController.getStats.bind(adminController));
router.get('/users', authMiddleware, adminController.getUsers.bind(adminController));
router.put('/users/:username', authMiddleware, adminController.updateUser.bind(adminController));

// Ban/Unban routes
router.put('/users/:username/ban', authMiddleware, adminController.banUser.bind(adminController));
router.put('/users/:username/unban', authMiddleware, adminController.unbanUser.bind(adminController));

// Transactions routes (public for testing)
router.get('/transactions', transactionsController.getTransactions.bind(transactionsController));
router.get('/transactions/:id', transactionsController.getTransaction.bind(transactionsController));

// Ticket routes - specific routes MUST come before parameterized routes
router.get('/tickets/weekly', authMiddleware, ticketsController.getWeeklyTickets.bind(ticketsController));
router.get('/tickets/monthly', authMiddleware, ticketsController.getMonthlyTickets.bind(ticketsController));
router.get('/tickets/range', authMiddleware, adminController.getTicketsByDateRange.bind(adminController));
router.post('/tickets/pick-winners', authMiddleware, adminController.pickWinners.bind(adminController));

// General tickets routes (these come after specific routes)
router.get('/tickets', ticketsController.getTickets.bind(ticketsController));
router.get('/tickets/:id', ticketsController.getTicket.bind(ticketsController));
router.put('/tickets/:id/status', ticketsController.updateTicketStatus.bind(ticketsController));

// Basic admin route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes are working' });
});

export default router;