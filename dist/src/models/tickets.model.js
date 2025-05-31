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
exports.TicketsModel = void 0;
const database_1 = require("../config/database");
class TicketsModel {
    getAllTickets(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Executing getAllTickets query with date filters:', { startDate, endDate });
                let query = 'SELECT * FROM tickets';
                const params = [];
                if (startDate && endDate) {
                    query += ' WHERE created_at BETWEEN ? AND ?';
                    params.push(startDate, endDate);
                }
                else if (startDate) {
                    query += ' WHERE created_at >= ?';
                    params.push(startDate);
                }
                else if (endDate) {
                    query += ' WHERE created_at <= ?';
                    params.push(endDate);
                }
                query += ' ORDER BY created_at DESC';
                console.log('Query:', query);
                console.log('Params:', params);
                const [rows] = yield database_1.pool.query(query, params);
                console.log('Query result:', rows);
                return rows;
            }
            catch (error) {
                console.error('Error in getAllTickets:', error);
                throw error;
            }
        });
    }
    getTicketStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Executing getTicketStats query');
                const [stats] = yield database_1.pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN ticket_status = 'won' THEN 1 ELSE 0 END) as won_tickets,
          SUM(CASE WHEN ticket_status = 'pending' THEN 1 ELSE 0 END) as pending_tickets,
          SUM(stake_amt) as total_stake_amount,
          SUM(CASE WHEN ticket_status = 'won' THEN potential_winning ELSE 0 END) as total_winnings
        FROM tickets
      `);
                console.log('Stats result:', stats);
                return stats[0];
            }
            catch (error) {
                console.error('Error in getTicketStats:', error);
                throw error;
            }
        });
    }
    getTicketById(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Executing getTicketById query for:', ticketId);
                const [rows] = yield database_1.pool.query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
                const tickets = rows;
                console.log('Query result:', tickets);
                return tickets.length > 0 ? tickets[0] : null;
            }
            catch (error) {
                console.error('Error in getTicketById:', error);
                throw error;
            }
        });
    }
    updateTicketStatus(ticketId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const connection = yield database_1.pool.getConnection();
            try {
                yield connection.beginTransaction();
                console.log('\n=== Starting Database Transaction ===');
                console.log('Input parameters:', { ticketId, status });
                // First check if ticket exists and get details
                console.log('Executing ticket lookup query...');
                const [tickets] = yield connection.query(`SELECT 
           t.*,
           u.main_balance,
           u.mobile_no as user_mobile,
           u.username
         FROM tickets t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.ticket_id = ?`, [ticketId]);
                if (tickets.length === 0) {
                    console.log('Error: No ticket found with ID:', ticketId);
                    yield connection.rollback();
                    return false;
                }
                const ticket = tickets[0];
                console.log('\n=== Ticket Details ===');
                console.log({
                    ticketId: ticket.ticket_id,
                    userId: ticket.user_id,
                    username: ticket.username,
                    currentStatus: ticket.ticket_status,
                    newStatus: status,
                    potentialWinning: ticket.potential_winning,
                    currentBalance: ticket.main_balance
                });
                // Update the ticket status
                console.log('\n=== Updating Ticket Status ===');
                const [result] = yield connection.query('UPDATE tickets SET ticket_status = ?, updated_at = NOW() WHERE ticket_id = ? AND user_id = ?', [status, ticketId, ticket.user_id]);
                console.log('Status update result:', {
                    success: result.affectedRows > 0,
                    affectedRows: result.affectedRows
                });
                if (result.affectedRows === 0) {
                    console.log('Error: Failed to update ticket status');
                    yield connection.rollback();
                    return false;
                }
                // If status is 'won', update user balance and create transaction record
                if (status === 'won') {
                    console.log('\n=== Processing Winning Ticket ===');
                    console.log('Current State:', {
                        userId: ticket.user_id,
                        username: ticket.username,
                        currentBalance: ticket.main_balance,
                        potentialWinning: ticket.potential_winning,
                        expectedNewBalance: ticket.main_balance + ticket.potential_winning
                    });
                    // First verify current balance
                    const [currentBalances] = yield connection.query('SELECT main_balance FROM users WHERE id = ?', [ticket.user_id]);
                    const currentBalance = (_a = currentBalances[0]) === null || _a === void 0 ? void 0 : _a.main_balance;
                    console.log('Verified current balance:', {
                        fromInitialQuery: ticket.main_balance,
                        fromVerification: currentBalance
                    });
                    // Update user's balance using JOIN query
                    console.log('\n=== Updating User Balance ===');
                    const [updateBalanceResult] = yield connection.query(`UPDATE users u
           JOIN tickets t ON u.id = t.user_id
           SET u.main_balance = u.main_balance + t.potential_winning,
               u.updatedAt = NOW()
           WHERE t.ticket_id = ?
             AND t.user_id = ?
             AND t.ticket_status = 'won'`, [ticketId, ticket.user_id]);
                    console.log('Balance update result:', {
                        success: updateBalanceResult.affectedRows > 0,
                        affectedRows: updateBalanceResult.affectedRows
                    });
                    if (updateBalanceResult.affectedRows === 0) {
                        console.log('Error: Failed to update user balance');
                        yield connection.rollback();
                        return false;
                    }
                    // Verify the balance was updated correctly
                    const [updatedBalances] = yield connection.query('SELECT main_balance FROM users WHERE id = ?', [ticket.user_id]);
                    const updatedBalance = (_b = updatedBalances[0]) === null || _b === void 0 ? void 0 : _b.main_balance;
                    console.log('\n=== Balance Update Verification ===');
                    console.log({
                        originalBalance: ticket.main_balance,
                        winningAmount: ticket.potential_winning,
                        expectedNewBalance: ticket.main_balance + ticket.potential_winning,
                        actualNewBalance: updatedBalance,
                        balanceUpdateSuccessful: updatedBalance === (ticket.main_balance + ticket.potential_winning)
                    });
                    // Create transaction record using JOIN query
                    console.log('\n=== Creating Transaction Record ===');
                    const [transactionResult] = yield connection.query(`INSERT INTO transactions (
             user_id,
             amount,
             amount_involved,
             acct_balance,
             time_stamp,
             trans_date,
             transaction_type,
             status,
             reference,
             createdAt,
             updatedAt
           )
           SELECT
             u.id,
             t.potential_winning,
             t.potential_winning,
             u.main_balance,
             t.time_stamp,
             t.draw_date,
             'winning',
             'completed',
             CONCAT('WIN-', t.ticket_id),
             NOW(),
             NOW()
           FROM users u
           JOIN tickets t ON u.id = t.user_id
           WHERE t.ticket_id = ?
             AND t.user_id = ?
             AND t.ticket_status = 'won'`, [ticketId, ticket.user_id]);
                    console.log('Transaction record creation:', {
                        success: transactionResult.affectedRows > 0,
                        transactionId: transactionResult.insertId
                    });
                    if (transactionResult.affectedRows === 0) {
                        console.log('Error: Failed to create transaction record');
                        yield connection.rollback();
                        return false;
                    }
                    // Verify the transaction record
                    const [transactionVerification] = yield connection.query('SELECT * FROM transactions WHERE id = ?', [transactionResult.insertId]);
                    console.log('\n=== Final Verification ===');
                    console.log({
                        ticketId,
                        userId: ticket.user_id,
                        username: ticket.username,
                        originalBalance: ticket.main_balance,
                        winningAmount: ticket.potential_winning,
                        finalBalance: updatedBalance,
                        transactionCreated: transactionVerification.length > 0,
                        transactionId: transactionResult.insertId
                    });
                }
                else {
                    console.log('Status is not "won", skipping balance update and transaction');
                }
                yield connection.commit();
                console.log('\n=== Transaction Complete ===');
                return true;
            }
            catch (error) {
                yield connection.rollback();
                console.error('\n=== Error in updateTicketStatus ===');
                console.error('Error details:', error);
                if (error instanceof Error) {
                    console.error('Error message:', error.message);
                    console.error('Error stack:', error.stack);
                }
                console.error('=== Error Log End ===\n');
                throw error;
            }
            finally {
                connection.release();
            }
        });
    }
    deleteTicket(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Executing deleteTicket query for:', ticketId);
                const ticket = yield this.getTicketById(ticketId.toString());
                if (!ticket)
                    return null;
                yield database_1.pool.query('DELETE FROM tickets WHERE id = ?', [ticketId]);
                console.log('Ticket deleted successfully');
                return ticket;
            }
            catch (error) {
                console.error('Error in deleteTicket:', error);
                throw error;
            }
        });
    }
    pickWinnerForDraw(drawDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield database_1.pool.getConnection();
            try {
                yield connection.beginTransaction();
                // Check if a winner already exists for this draw
                const [existingWinners] = yield connection.query('SELECT * FROM tickets WHERE draw_date = ? AND ticket_status = "won"', [drawDate]);
                if (existingWinners.length > 0) {
                    yield connection.rollback();
                    return false; // Winner already picked
                }
                // Get all pending tickets for this draw
                const [pendingTickets] = yield connection.query('SELECT * FROM tickets WHERE draw_date = ? AND ticket_status = "pending"', [drawDate]);
                if (pendingTickets.length === 0) {
                    yield connection.rollback();
                    return false; // No tickets to pick from
                }
                // Pick a random winner
                const randomIndex = Math.floor(Math.random() * pendingTickets.length);
                const winner = pendingTickets[randomIndex];
                // Update the winner's status to 'won'
                const [updateResult] = yield connection.query('UPDATE tickets SET ticket_status = "won", updated_at = NOW() WHERE id = ?', [winner.id]);
                if (updateResult.affectedRows === 0) {
                    yield connection.rollback();
                    return false;
                }
                // Log picking the winner
                yield connection.query(`INSERT INTO activity_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())`, [null, 'AUTO_WINNER_PICKED', `Ticket ${winner.ticket_id} for user ${winner.user_id} automatically picked as winner for draw ${drawDate}.`]);
                // Update the user's balance
                const [balanceResult] = yield connection.query('UPDATE users SET main_balance = main_balance + ? WHERE id = ?', [winner.potential_winning, winner.user_id]);
                if (balanceResult.affectedRows === 0) {
                    yield connection.rollback();
                    return false;
                }
                // Log balance update
                yield connection.query(`INSERT INTO activity_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())`, [null, 'USER_BALANCE_UPDATED', `User ${winner.user_id} balance increased by ${winner.potential_winning} for winning ticket ${winner.ticket_id}.`]);
                // Insert a transaction record
                yield connection.query(`INSERT INTO transactions (
           user_id, amount, amount_involved, acct_balance, time_stamp, trans_date, transaction_type, status, reference, createdAt, updatedAt
         ) VALUES (?, ?, ?, (SELECT main_balance FROM users WHERE id = ?), ?, ?, 'winning', 'completed', ?, NOW(), NOW())`, [winner.user_id, winner.potential_winning, winner.potential_winning, winner.user_id, winner.time_stamp, winner.draw_date, `WIN-${winner.ticket_id}`]);
                // Log transaction creation
                yield connection.query(`INSERT INTO activity_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())`, [null, 'WINNING_TRANSACTION_CREATED', `Transaction record created for user ${winner.user_id}, ticket ${winner.ticket_id}, amount ${winner.potential_winning}.`]);
                yield connection.commit();
                return true;
            }
            catch (error) {
                yield connection.rollback();
                console.error('Error in pickWinnerForDraw:', error);
                return false;
            }
            finally {
                connection.release();
            }
        });
    }
}
exports.TicketsModel = TicketsModel;
