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
}
exports.TicketsController = TicketsController;
