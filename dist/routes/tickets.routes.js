"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tickets_controller_1 = require("../controllers/tickets.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
const ticketsController = new tickets_controller_1.TicketsController();
const adminController = new admin_controller_1.AdminController();
console.log('=== Setting up Tickets Routes ===');
// Weekly, Monthly, and Range routes (must come before parameterized routes)
router.get('/weekly', (req, res) => {
    console.log('GET /api/admin/tickets/weekly route hit');
    adminController.getWeeklyTickets(req, res);
});
router.get('/monthly', (req, res) => {
    console.log('GET /api/admin/tickets/monthly route hit');
    adminController.getMonthlyTickets(req, res);
});
router.get('/range', (req, res) => {
    console.log('GET /api/admin/tickets/range route hit');
    adminController.getTicketsByDateRange(req, res);
});
router.post('/pick-winners', (req, res) => {
    console.log('POST /api/admin/tickets/pick-winners route hit');
    adminController.pickWinners(req, res);
});
// Public routes
router.get('/', (req, res) => {
    console.log('GET /api/admin/tickets route hit');
    console.log('Full URL:', req.originalUrl);
    ticketsController.getTickets(req, res);
});
router.get('/stats', (req, res) => {
    console.log('GET /api/admin/tickets/stats route hit');
    console.log('Full URL:', req.originalUrl);
    ticketsController.getTicketStats(req, res);
});
router.get('/:ticketId', (req, res) => {
    console.log('GET /api/admin/tickets/:ticketId route hit');
    console.log('Full URL:', req.originalUrl);
    console.log('Params:', req.params);
    ticketsController.getTicketById(req, res);
});
// Status update route - handle both PATCH and PUT
router.patch('/:ticketId/status', (req, res) => {
    console.log('\n=== Status Update Request (PATCH) ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Original URL:', req.originalUrl);
    console.log('Base URL:', req.baseUrl);
    console.log('Path:', req.path);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    console.log('=====================\n');
    ticketsController.updateTicketStatus(req, res);
});
router.put('/:ticketId/status', (req, res) => {
    console.log('\n=== Status Update Request (PUT) ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Original URL:', req.originalUrl);
    console.log('Base URL:', req.baseUrl);
    console.log('Path:', req.path);
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('Headers:', req.headers);
    // Ensure ticketId is passed correctly
    const { ticketId } = req.params;
    if (!ticketId) {
        return res.status(400).json({ error: 'Ticket ID is required' });
    }
    console.log('Processing status update for ticket:', ticketId);
    ticketsController.updateTicketStatus(req, res);
});
router.delete('/:ticketId', (req, res) => {
    console.log('DELETE /api/admin/tickets/:ticketId route hit');
    console.log('Full URL:', req.originalUrl);
    console.log('Params:', req.params);
    ticketsController.deleteTicket(req, res);
});
console.log('Tickets routes setup complete');
console.log('=====================');
exports.default = router;
