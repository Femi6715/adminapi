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
const tickets_model_1 = require("../models/tickets.model");
class TicketsController {
    constructor() {
        this.getTickets = (req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log('\n=== getTickets called ===');
            console.log('Request URL:', req.url);
            console.log('Request method:', req.method);
            console.log('Request headers:', req.headers);
            console.log('Request params:', req.params);
            console.log('Request query:', req.query);
            try {
                const { startDate, endDate } = req.query;
                console.log('Date filters:', { startDate, endDate });
                console.log('Calling ticketsModel.getAllTickets() with date filters');
                const tickets = yield this.ticketsModel.getAllTickets(startDate, endDate);
                const ticketsArray = tickets;
                console.log('Tickets retrieved successfully, count:', ticketsArray ? ticketsArray.length : 0);
                console.log('First ticket (if any):', ticketsArray && ticketsArray.length > 0 ? ticketsArray[0] : 'No tickets found');
                if (!ticketsArray || ticketsArray.length === 0) {
                    console.log('No tickets found in database');
                    return res.status(404).json({ error: 'No tickets found' });
                }
                res.json({ tickets: tickets });
            }
            catch (error) {
                console.error('Error fetching tickets:', error);
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        });
        this.getTicketStats = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this.ticketsModel.getTicketStats();
                res.json(stats);
            }
            catch (error) {
                console.error('Error fetching ticket stats:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        this.getTicketById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { ticketId } = req.params;
                const ticket = yield this.ticketsModel.getTicketById(ticketId);
                if (!ticket) {
                    return res.status(404).json({ error: 'Ticket not found' });
                }
                res.json({ ticket });
            }
            catch (error) {
                console.error('Error fetching ticket:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        this.updateTicketStatus = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { ticketId } = req.params;
                const { status } = req.body;
                console.log('\n=== Starting Ticket Status Update ===');
                console.log('Request details:', {
                    ticketId,
                    status,
                    body: req.body,
                    headers: req.headers,
                    url: req.url,
                    method: req.method
                });
                if (!status) {
                    console.log('Error: Status is required');
                    return res.status(400).json({ error: 'Status is required' });
                }
                // Validate the status value
                const validStatuses = ['pending', 'won', 'lose'];
                if (!validStatuses.includes(status.toLowerCase())) {
                    console.log('Error: Invalid status value:', status);
                    return res.status(400).json({
                        error: 'Invalid status',
                        message: `Status must be one of: ${validStatuses.join(', ')}`
                    });
                }
                // First get the ticket to check if it exists
                console.log('Fetching ticket details for:', ticketId);
                const ticket = yield this.ticketsModel.getTicketById(ticketId);
                if (!ticket) {
                    console.log('Error: Ticket not found:', ticketId);
                    return res.status(404).json({
                        error: 'Ticket not found',
                        message: `No ticket found with ID: ${ticketId}`
                    });
                }
                console.log('Found ticket:', {
                    ticketId: ticket.ticket_id,
                    userId: ticket.user_id,
                    currentStatus: ticket.ticket_status,
                    potentialWinning: ticket.potential_winning,
                    stakeAmount: ticket.stake_amt
                });
                // Update the ticket status
                console.log('Attempting to update ticket status to:', status);
                const success = yield this.ticketsModel.updateTicketStatus(ticketId, status);
                if (!success) {
                    console.log('Error: Failed to update ticket status');
                    return res.status(400).json({
                        error: 'Update failed',
                        message: 'Failed to update ticket status. Please try again.'
                    });
                }
                // Get the updated ticket
                console.log('Fetching updated ticket details...');
                const updatedTicket = yield this.ticketsModel.getTicketById(ticketId);
                if (!updatedTicket) {
                    console.log('Error: Updated ticket not found');
                    return res.status(404).json({
                        error: 'Updated ticket not found',
                        message: 'The ticket was updated but could not be retrieved'
                    });
                }
                console.log('Successfully updated ticket:', {
                    ticketId: updatedTicket.ticket_id,
                    newStatus: updatedTicket.ticket_status,
                    userId: updatedTicket.user_id,
                    potentialWinning: updatedTicket.potential_winning
                });
                console.log('=== Ticket Status Update Complete ===\n');
                // Send detailed response
                res.json({
                    message: 'Ticket status updated successfully',
                    ticket: updatedTicket,
                    details: {
                        ticketId: updatedTicket.ticket_id,
                        status: updatedTicket.ticket_status,
                        userId: updatedTicket.user_id,
                        potentialWinning: updatedTicket.potential_winning
                    }
                });
            }
            catch (error) {
                console.error('\n=== Error in updateTicketStatus ===');
                console.error('Error details:', error);
                if (error instanceof Error) {
                    console.error('Error message:', error.message);
                    console.error('Error stack:', error.stack);
                }
                console.error('=== Error Log End ===\n');
                res.status(500).json({
                    error: 'Internal server error',
                    message: error instanceof Error ? error.message : 'Unknown error occurred'
                });
            }
        });
        this.deleteTicket = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const ticketId = parseInt(req.params.ticket_id, 10);
                const deletedTicket = yield this.ticketsModel.deleteTicket(ticketId);
                if (!deletedTicket) {
                    return res.status(404).json({ error: 'Ticket not found' });
                }
                res.json({ message: 'Ticket deleted successfully' });
            }
            catch (error) {
                console.error('Error deleting ticket:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        this.ticketsModel = new tickets_model_1.TicketsModel();
        console.log('TicketsController initialized');
    }
}
exports.TicketsController = TicketsController;
