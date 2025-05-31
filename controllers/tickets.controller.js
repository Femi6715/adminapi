"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsController = void 0;
const database_1 = require("../config/database");
class TicketsController {
    getTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Attempting to fetch tickets...');
                const [rows] = yield database_1.pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
                console.log('Successfully fetched tickets:', rows.length);
                res.json({ tickets: rows });
            }
            catch (error) {
                console.error('Error fetching tickets:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    if (error.message.includes('Table')) {
                        res.status(404).json({ message: 'Tickets table not found in database' });
                    }
                    else {
                        res.status(500).json({ message: 'Error fetching tickets', details: error.message });
                    }
                }
                else {
                    res.status(500).json({ message: 'Unknown error fetching tickets' });
                }
            }
        });
    }
    getTicket(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                console.log('Attempting to fetch ticket with ID:', id);
                const [rows] = yield database_1.pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
                if (rows.length === 0) {
                    res.status(404).json({ message: 'Ticket not found' });
                    return;
                }
                console.log('Successfully fetched ticket');
                res.json(rows[0]);
            }
            catch (error) {
                console.error('Error fetching ticket:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    if (error.message.includes('Table')) {
                        res.status(404).json({ message: 'Tickets table not found in database' });
                    }
                    else {
                        res.status(500).json({ message: 'Error fetching ticket', details: error.message });
                    }
                }
                else {
                    res.status(500).json({ message: 'Unknown error fetching ticket' });
                }
            }
        });
    }
    updateTicketStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { status } = req.body;
                console.log('Request params:', req.params);
                console.log('Request body:', req.body);
                console.log('Attempting to update ticket status:', { id, status });
                // First check if ticket exists
                const [tickets] = yield database_1.pool.query('SELECT * FROM tickets WHERE ticket_id = ?', [id]);
                console.log('Found tickets:', tickets);
                if (tickets.length === 0) {
                    console.log('No ticket found with ticket_id:', id);
                    res.status(404).json({ message: 'Ticket not found' });
                    return;
                }
                // Update the ticket status
                const [result] = yield database_1.pool.query('UPDATE tickets SET ticket_status = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?', [status, id]);
                console.log('Update result:', result);
                if (result.affectedRows === 0) {
                    console.log('No rows affected by update');
                    res.status(404).json({ message: 'Failed to update ticket status' });
                    return;
                }
                // Get the updated ticket
                const [updatedTickets] = yield database_1.pool.query('SELECT * FROM tickets WHERE ticket_id = ?', [id]);
                console.log('Updated ticket:', updatedTickets[0]);
                console.log('Successfully updated ticket status');
                res.json({
                    message: 'Ticket status updated successfully',
                    ticket: updatedTickets[0]
                });
            }
            catch (error) {
                console.error('Error updating ticket status:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    res.status(500).json({ message: 'Error updating ticket status', details: error.message });
                }
                else {
                    res.status(500).json({ message: 'Unknown error updating ticket status' });
                }
            }
        });
    }
    getWeeklyTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Attempting to fetch weekly tickets...');
                // First check database connection
                try {
                    yield database_1.pool.query('SELECT 1');
                    console.log('Database connection successful');
                }
                catch (dbError) {
                    console.error('Database connection failed:', dbError);
                    throw new Error('Database connection failed');
                }
                // Check if tickets table exists
                const [tables] = yield database_1.pool.query("SHOW TABLES LIKE 'tickets'");
                console.log('Tickets table exists:', tables.length > 0);
                if (tables.length === 0) {
                    throw new Error('Tickets table does not exist');
                }
                // Check table structure
                const [columns] = yield database_1.pool.query("SHOW COLUMNS FROM tickets");
                console.log('Tickets table columns:', columns.map(c => c.Field));
                // First check if we have any tickets at all
                const [allTickets] = yield database_1.pool.query('SELECT COUNT(*) as count FROM tickets');
                console.log('Total tickets in database:', allTickets[0].count);
                if (allTickets[0].count === 0) {
                    console.log('No tickets found in database');
                    return res.json({ tickets: [] });
                }
                // Get the current date and date 7 days ago for debugging
                const [dates] = yield database_1.pool.query('SELECT CURDATE() as current_date, DATE_SUB(CURDATE(), INTERVAL 7 DAY) as seven_days_ago');
                console.log('Current date:', dates[0].current_date);
                console.log('Seven days ago:', dates[0].seven_days_ago);
                // Get tickets from last 7 days with more explicit date handling
                const [rows] = yield database_1.pool.query(`SELECT * FROM tickets 
         WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         AND DATE(created_at) <= CURDATE()
         ORDER BY created_at DESC`);
                // Log some sample data if we have tickets
                if (rows.length > 0) {
                    console.log('Sample ticket created_at:', rows[0].created_at);
                    console.log('Sample ticket data:', {
                        id: rows[0].id,
                        ticket_id: rows[0].ticket_id,
                        created_at: rows[0].created_at,
                        ticket_status: rows[0].ticket_status
                    });
                }
                else {
                    // If no tickets found, let's check what tickets we do have
                    const [recentTickets] = yield database_1.pool.query('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 5');
                    if (recentTickets.length > 0) {
                        console.log('Most recent tickets (not in weekly range):', recentTickets.map(t => ({
                            id: t.id,
                            ticket_id: t.ticket_id,
                            created_at: t.created_at,
                            ticket_status: t.ticket_status
                        })));
                    }
                }
                console.log('Successfully fetched weekly tickets:', rows.length);
                res.json({ tickets: rows });
            }
            catch (error) {
                console.error('Error fetching weekly tickets:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    if (error.message.includes('Table')) {
                        res.status(404).json({ message: 'Tickets table not found in database' });
                    }
                    else {
                        res.status(500).json({ message: 'Error fetching weekly tickets', details: error.message });
                    }
                }
                else {
                    res.status(500).json({ message: 'Unknown error fetching weekly tickets' });
                }
            }
        });
    }
    getMonthlyTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Attempting to fetch monthly tickets...');
                const [rows] = yield database_1.pool.query('SELECT * FROM tickets WHERE created_at >= CURDATE() - INTERVAL 30 DAY ORDER BY created_at DESC');
                console.log('Successfully fetched monthly tickets:', rows.length);
                res.json({ tickets: rows });
            }
            catch (error) {
                console.error('Error fetching monthly tickets:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    if (error.message.includes('Table')) {
                        res.status(404).json({ message: 'Tickets table not found in database' });
                    }
                    else {
                        res.status(500).json({ message: 'Error fetching monthly tickets', details: error.message });
                    }
                }
                else {
                    res.status(500).json({ message: 'Unknown error fetching monthly tickets' });
                }
            }
        });
    }
}
exports.TicketsController = TicketsController;
