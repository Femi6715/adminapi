import { pool } from '../config/database';

export interface Ticket {
  id: number;
  ticket_id: string;
  user_id: number;
  game_id: string;
  mobile_no: string;
  stake_amt: number;
  potential_winning: number;
  time_stamp: number;
  draw_time: string;
  draw_date: string;
  ticket_status: string;
  created_at: Date;
  updated_at: Date;
}

export class TicketsModel {
  async getAllTickets(startDate?: string, endDate?: string): Promise<Ticket[]> {
    try {
      console.log('Executing getAllTickets query with date filters:', { startDate, endDate });
      
      let query = 'SELECT * FROM tickets';
      const params: any[] = [];
      
      if (startDate && endDate) {
        query += ' WHERE created_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' WHERE created_at >= ?';
        params.push(startDate);
      } else if (endDate) {
        query += ' WHERE created_at <= ?';
        params.push(endDate);
      }
      
      query += ' ORDER BY created_at DESC';
      
      console.log('Query:', query);
      console.log('Params:', params);
      
      const [rows] = await pool.query(query, params);
      console.log('Query result:', rows);
      return rows as Ticket[];
    } catch (error) {
      console.error('Error in getAllTickets:', error);
      throw error;
    }
  }

  async getTicketStats() {
    try {
      console.log('Executing getTicketStats query');
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          SUM(CASE WHEN ticket_status = 'won' THEN 1 ELSE 0 END) as won_tickets,
          SUM(CASE WHEN ticket_status = 'pending' THEN 1 ELSE 0 END) as pending_tickets,
          SUM(stake_amt) as total_stake_amount,
          SUM(CASE WHEN ticket_status = 'won' THEN potential_winning ELSE 0 END) as total_winnings
        FROM tickets
      `);
      console.log('Stats result:', stats);
      return (stats as any[])[0];
    } catch (error) {
      console.error('Error in getTicketStats:', error);
      throw error;
    }
  }

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      console.log('Executing getTicketById query for:', ticketId);
      const [rows] = await pool.query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
      const tickets = rows as Ticket[];
      console.log('Query result:', tickets);
      return tickets.length > 0 ? tickets[0] : null;
    } catch (error) {
      console.error('Error in getTicketById:', error);
      throw error;
    }
  }

  async updateTicketStatus(ticketId: string, status: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      console.log('\n=== Starting Database Transaction ===');
      console.log('Input parameters:', { ticketId, status });

      // First check if ticket exists and get details
      console.log('Executing ticket lookup query...');
      const [tickets] = await connection.query(
        `SELECT 
           t.*,
           u.main_balance,
           u.mobile_no as user_mobile,
           u.username
         FROM tickets t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.ticket_id = ?`,
        [ticketId]
      ) as [Array<Ticket & { main_balance: number; user_mobile: string; username: string }>, any];

      if (tickets.length === 0) {
        console.log('Error: No ticket found with ID:', ticketId);
        await connection.rollback();
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
      const [result] = await connection.query(
        'UPDATE tickets SET ticket_status = ?, updated_at = NOW() WHERE ticket_id = ? AND user_id = ?',
        [status, ticketId, ticket.user_id]
      ) as [{ affectedRows: number }, any];

      console.log('Status update result:', {
        success: result.affectedRows > 0,
        affectedRows: result.affectedRows
      });

      if (result.affectedRows === 0) {
        console.log('Error: Failed to update ticket status');
        await connection.rollback();
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
        const [currentBalances] = await connection.query(
          'SELECT main_balance FROM users WHERE id = ?',
          [ticket.user_id]
        ) as [Array<{ main_balance: number }>, any];

        const currentBalance = currentBalances[0]?.main_balance;
        console.log('Verified current balance:', {
          fromInitialQuery: ticket.main_balance,
          fromVerification: currentBalance
        });

        // Update user's balance using JOIN query
        console.log('\n=== Updating User Balance ===');
        const [updateBalanceResult] = await connection.query(
          `UPDATE users u
           JOIN tickets t ON u.id = t.user_id
           SET u.main_balance = u.main_balance + t.potential_winning,
               u.updatedAt = NOW()
           WHERE t.ticket_id = ?
             AND t.user_id = ?
             AND t.ticket_status = 'won'`,
          [ticketId, ticket.user_id]
        ) as [{ affectedRows: number }, any];

        console.log('Balance update result:', {
          success: updateBalanceResult.affectedRows > 0,
          affectedRows: updateBalanceResult.affectedRows
        });

        if (updateBalanceResult.affectedRows === 0) {
          console.log('Error: Failed to update user balance');
          await connection.rollback();
          return false;
        }

        // Verify the balance was updated correctly
        const [updatedBalances] = await connection.query(
          'SELECT main_balance FROM users WHERE id = ?',
          [ticket.user_id]
        ) as [Array<{ main_balance: number }>, any];

        const updatedBalance = updatedBalances[0]?.main_balance;
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
        const [transactionResult] = await connection.query(
          `INSERT INTO transactions (
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
             AND t.ticket_status = 'won'`,
          [ticketId, ticket.user_id]
        ) as [{ affectedRows: number; insertId: number }, any];

        console.log('Transaction record creation:', {
          success: transactionResult.affectedRows > 0,
          transactionId: transactionResult.insertId
        });

        if (transactionResult.affectedRows === 0) {
          console.log('Error: Failed to create transaction record');
          await connection.rollback();
          return false;
        }

        // Verify the transaction record
        const [transactionVerification] = await connection.query(
          'SELECT * FROM transactions WHERE id = ?',
          [transactionResult.insertId]
        ) as [Array<any>, any];

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
      } else {
        console.log('Status is not "won", skipping balance update and transaction');
      }

      await connection.commit();
      console.log('\n=== Transaction Complete ===');
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('\n=== Error in updateTicketStatus ===');
      console.error('Error details:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      console.error('=== Error Log End ===\n');
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteTicket(ticketId: number) {
    try {
      console.log('Executing deleteTicket query for:', ticketId);
      const ticket = await this.getTicketById(ticketId.toString());
      if (!ticket) return null;
      await pool.query('DELETE FROM tickets WHERE id = ?', [ticketId]);
      console.log('Ticket deleted successfully');
      return ticket;
    } catch (error) {
      console.error('Error in deleteTicket:', error);
      throw error;
    }
  }

  async pickWinnerForDraw(drawDate: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Check if a winner already exists for this draw
      const [existingWinners] = await connection.query(
        'SELECT * FROM tickets WHERE draw_date = ? AND ticket_status = "won"',
        [drawDate]
      ) as [Ticket[], any];
      if (existingWinners.length > 0) {
        await connection.rollback();
        return false; // Winner already picked
      }
      // Get all pending tickets for this draw
      const [pendingTickets] = await connection.query(
        'SELECT * FROM tickets WHERE draw_date = ? AND ticket_status = "pending"',
        [drawDate]
      ) as [Ticket[], any];
      if (pendingTickets.length === 0) {
        await connection.rollback();
        return false; // No tickets to pick from
      }
      // Pick a random winner
      const randomIndex = Math.floor(Math.random() * pendingTickets.length);
      const winner = pendingTickets[randomIndex];
      // Update the winner's status to 'won'
      const [updateResult] = await connection.query(
        'UPDATE tickets SET ticket_status = "won", updated_at = NOW() WHERE id = ?',
        [winner.id]
      ) as [{ affectedRows: number }, any];
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return false;
      }
      // Log picking the winner
      await connection.query(
        `INSERT INTO activity_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())`,
        [null, 'AUTO_WINNER_PICKED', `Ticket ${winner.ticket_id} for user ${winner.user_id} automatically picked as winner for draw ${drawDate}.`]
      );
      // Update the user's balance
      const [balanceResult] = await connection.query(
        'UPDATE users SET main_balance = main_balance + ? WHERE id = ?',
        [winner.potential_winning, winner.user_id]
      ) as [{ affectedRows: number }, any];
      if (balanceResult.affectedRows === 0) {
        await connection.rollback();
        return false;
      }
      // Log balance update
      await connection.query(
        `INSERT INTO activity_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())`,
        [null, 'USER_BALANCE_UPDATED', `User ${winner.user_id} balance increased by ${winner.potential_winning} for winning ticket ${winner.ticket_id}.`]
      );
      // Insert a transaction record
      await connection.query(
        `INSERT INTO transactions (
           user_id, amount, amount_involved, acct_balance, time_stamp, trans_date, transaction_type, status, reference, createdAt, updatedAt
         ) VALUES (?, ?, ?, (SELECT main_balance FROM users WHERE id = ?), ?, ?, 'winning', 'completed', ?, NOW(), NOW())`,
        [winner.user_id, winner.potential_winning, winner.potential_winning, winner.user_id, winner.time_stamp, winner.draw_date, `WIN-${winner.ticket_id}`]
      );
      // Log transaction creation
      await connection.query(
        `INSERT INTO activity_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())`,
        [null, 'WINNING_TRANSACTION_CREATED', `Transaction record created for user ${winner.user_id}, ticket ${winner.ticket_id}, amount ${winner.potential_winning}.`]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error in pickWinnerForDraw:', error);
      return false;
    } finally {
      connection.release();
    }
  }
} 