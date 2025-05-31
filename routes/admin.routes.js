"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const transactions_controller_1 = require("../controllers/transactions.controller");
const tickets_controller_1 = require("../controllers/tickets.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
const transactionsController = new transactions_controller_1.TransactionsController();
const ticketsController = new tickets_controller_1.TicketsController();
// Public routes
router.post('/login', adminController.login.bind(adminController));
// Protected routes
router.get('/profile', auth_middleware_1.authMiddleware, adminController.getProfile.bind(adminController));
router.get('/stats', auth_middleware_1.authMiddleware, adminController.getStats.bind(adminController));
router.get('/users', auth_middleware_1.authMiddleware, adminController.getUsers.bind(adminController));
router.put('/users/:username', auth_middleware_1.authMiddleware, adminController.updateUser.bind(adminController));
// Ban/Unban routes
router.put('/users/:username/ban', auth_middleware_1.authMiddleware, adminController.banUser.bind(adminController));
router.put('/users/:username/unban', auth_middleware_1.authMiddleware, adminController.unbanUser.bind(adminController));
// Transactions routes (public for testing)
router.get('/transactions', transactionsController.getTransactions.bind(transactionsController));
router.get('/transactions/:id', transactionsController.getTransaction.bind(transactionsController));
// Ticket routes - specific routes MUST come before parameterized routes
router.get('/tickets/weekly', auth_middleware_1.authMiddleware, ticketsController.getWeeklyTickets.bind(ticketsController));
router.get('/tickets/monthly', auth_middleware_1.authMiddleware, ticketsController.getMonthlyTickets.bind(ticketsController));
router.get('/tickets/range', auth_middleware_1.authMiddleware, adminController.getTicketsByDateRange.bind(adminController));
router.post('/tickets/pick-winners', auth_middleware_1.authMiddleware, adminController.pickWinners.bind(adminController));
// General tickets routes (these come after specific routes)
router.get('/tickets', ticketsController.getTickets.bind(ticketsController));
router.get('/tickets/:id', ticketsController.getTicket.bind(ticketsController));
router.put('/tickets/:id/status', ticketsController.updateTicketStatus.bind(ticketsController));
// Basic admin route
router.get('/test', (req, res) => {
    res.json({ message: 'Admin routes are working' });
});
exports.default = router;
