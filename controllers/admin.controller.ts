import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { environment } from '../config/environment';
import { RowDataPacket } from 'mysql2';

interface Admin extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  created_at: Date;
}

interface StatsRow extends RowDataPacket {
  total: number;
}

export class AdminController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      // Get admin from database
      const [rows] = await pool.query<Admin[]>(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );

      const admin = rows[0];

      if (!admin) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Check password
      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Generate JWT token
      const payload = { id: admin.id, username: admin.username };
      const options = { expiresIn: 3600 }; // 1 hour in seconds
      const secret = Buffer.from(environment.jwt.secret, 'utf-8');
      const token = jwt.sign(payload, secret, options);

      res.json({
        message: 'Login successful',
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      // The user ID is available from the auth middleware
      const userId = (req as any).user.id;

      const [rows] = await pool.query<Admin[]>(
        'SELECT id, username, created_at FROM admins WHERE id = ?',
        [userId]
      );

      const admin = rows[0];

      if (!admin) {
        res.status(404).json({ message: 'Admin not found' });
        return;
      }

      res.json({ admin });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Error getting profile' });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      // Get total registered users
      const [userRows] = await pool.query<StatsRow[]>(
        'SELECT COUNT(*) as total FROM users'
      );
      const totalUsers = userRows[0]['total'];

      // Get total tickets
      const [ticketRows] = await pool.query<StatsRow[]>(
        'SELECT COUNT(*) as total FROM tickets'
      );
      const totalTickets = ticketRows[0]['total'];

      // Get total transactions
      const [transactionRows] = await pool.query<StatsRow[]>(
        'SELECT COUNT(*) as total FROM transactions'
      );
      const totalTransactions = transactionRows[0]['total'];

      // Get total stake amount
      const [stakeRows] = await pool.query<StatsRow[]>(
        'SELECT COALESCE(SUM(stake_amt), 0) as total FROM tickets'
      );
      const totalStakeAmount = stakeRows[0]['total'];

      // Get total potential winnings
      const [winningRows] = await pool.query<StatsRow[]>(
        'SELECT COALESCE(SUM(potential_winning), 0) as total FROM tickets'
      );
      const totalPotentialWinnings = winningRows[0]['total'];

      // Get total transaction amount
      const [transactionAmountRows] = await pool.query<StatsRow[]>(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = "completed"'
      );
      const totalTransactionAmount = transactionAmountRows[0]['total'];

      res.json({
        stats: {
          totalUsers,
          totalTickets,
          totalTransactions,
          totalStakeAmount,
          totalPotentialWinnings,
          totalTransactionAmount
        }
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ message: 'Error getting dashboard statistics' });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const [rows] = await pool.query(`
        SELECT 
          username, 
          firstname as firstName, 
          surname as lastName, 
          createdAt, 
          main_balance as mainBalance, 
          bonus, 
          email, 
          mobile_no as phoneNumber,
          is_banned as isBanned
        FROM users
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const { firstName, lastName, email, phoneNumber, mainBalance, bonus } = req.body;

      console.log('Update request received:', {
        username,
        body: req.body,
        params: req.params
      });

      // First check if user exists with more detailed query
      const [userRows] = await pool.query<RowDataPacket[]>(
        'SELECT username, firstname, surname, email FROM users WHERE LOWER(username) = LOWER(?)',
        [username]
      );

      console.log('User check result:', userRows);

      if (userRows.length === 0) {
        console.log('User not found:', username);
        return res.status(404).json({ 
          message: 'User not found',
          details: `No user exists with username: ${username}`,
          code: 'USER_NOT_FOUND'
        });
      }

      // Map camelCase request fields to snake_case database columns
      const updateQuery = `
        UPDATE users 
        SET 
          firstname = ?,
          surname = ?,
          email = ?,
          mobile_no = ?,
          main_balance = ?,
          bonus = ?
        WHERE LOWER(username) = LOWER(?)
      `;
      
      // Ensure all values are properly formatted
      const queryParams = [
        firstName?.trim() || null,
        lastName?.trim() || null,
        email?.trim() || null,
        phoneNumber?.trim() || null,
        mainBalance ? parseFloat(mainBalance.toString()) : 0,
        bonus ? parseFloat(bonus.toString()) : 0,
        username
      ];
      
      console.log('Executing update query:', {
        query: updateQuery,
        params: queryParams
      });

      // Update user in database
      const [result] = await pool.query(updateQuery, queryParams);

      console.log('Update result:', result);

      // Return the updated user data with consistent field names
      const [updatedUser] = await pool.query<RowDataPacket[]>(
        `SELECT 
          username,
          firstname as firstName,
          surname as lastName,
          email,
          mobile_no as phoneNumber,
          main_balance as mainBalance,
          bonus,
          is_banned as isBanned,
          createdAt,
          updatedAt
        FROM users 
        WHERE LOWER(username) = LOWER(?)`,
        [username]
      );

      if (!updatedUser[0]) {
        throw new Error('Failed to retrieve updated user data');
      }

      res.json({ 
        message: 'User updated successfully',
        user: updatedUser[0]
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'UPDATE_ERROR'
      });
    }
  }

  async banUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      
      console.log('Ban request received for user:', username);

      // First check if user exists
      const [userRows] = await pool.query<RowDataPacket[]>(
        'SELECT username FROM users WHERE username = ?',
        [username]
      );

      console.log('User check result:', userRows);

      if (userRows.length === 0) {
        console.log('User not found:', username);
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user's ban status
      const [result] = await pool.query(
        'UPDATE users SET is_banned = 1 WHERE username = ?',
        [username]
      );

      console.log('Ban update result:', result);

      res.json({ message: 'User banned successfully' });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({ 
        message: 'Error banning user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async unbanUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      
      console.log('Unban request received for user:', username);

      // First check if user exists
      const [userRows] = await pool.query<RowDataPacket[]>(
        'SELECT username FROM users WHERE username = ?',
        [username]
      );

      console.log('User check result:', userRows);

      if (userRows.length === 0) {
        console.log('User not found:', username);
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user's ban status
      const [result] = await pool.query(
        'UPDATE users SET is_banned = 0 WHERE username = ?',
        [username]
      );

      console.log('Unban update result:', result);

      res.json({ message: 'User unbanned successfully' });
    } catch (error) {
      console.error('Error unbanning user:', error);
      res.status(500).json({ 
        message: 'Error unbanning user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getWeeklyTickets(req: Request, res: Response) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [rows] = await pool.query(`
        SELECT 
          t.id,
          t.ticket_id,
          t.user_id,
          t.game_id,
          u.username,
          u.mobile_no,
          t.stake_amt,
          t.potential_winning,
          t.created_at,
          t.draw_time,
          t.draw_date,
          t.status,
          t.status as ticket_status
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.created_at >= ?
        AND t.status = 'active'
        ORDER BY t.created_at DESC
      `, [sevenDaysAgo]);

      res.json(rows);
    } catch (error) {
      console.error('Error fetching weekly tickets:', error);
      res.status(500).json({ message: 'Error fetching weekly tickets' });
    }
  }

  async getMonthlyTickets(req: Request, res: Response) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [rows] = await pool.query(`
        SELECT 
          t.id,
          t.ticket_id,
          t.user_id,
          t.game_id,
          u.username,
          u.mobile_no,
          t.stake_amt,
          t.potential_winning,
          t.created_at,
          t.draw_time,
          t.draw_date,
          t.status,
          t.status as ticket_status
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.created_at >= ?
        AND t.status = 'active'
        ORDER BY t.created_at DESC
      `, [thirtyDaysAgo]);

      res.json(rows);
    } catch (error) {
      console.error('Error fetching monthly tickets:', error);
      res.status(500).json({ message: 'Error fetching monthly tickets' });
    }
  }

  async getTicketsByDateRange(req: Request, res: Response) {
    try {
      const { fromDate, toDate } = req.query;

      if (!fromDate || !toDate) {
        return res.status(400).json({ message: 'From date and to date are required' });
      }

      const [rows] = await pool.query(`
        SELECT 
          t.id,
          t.ticket_id,
          t.user_id,
          t.game_id,
          u.username,
          u.mobile_no,
          t.stake_amt,
          t.potential_winning,
          t.created_at,
          t.draw_time,
          t.draw_date,
          t.status,
          t.status as ticket_status
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE DATE(t.created_at) BETWEEN ? AND ?
        AND t.status = 'active'
        ORDER BY t.created_at DESC
      `, [fromDate, toDate]);

      res.json(rows);
    } catch (error) {
      console.error('Error fetching tickets by date range:', error);
      res.status(500).json({ message: 'Error fetching tickets by date range' });
    }
  }

  async pickWinners(req: Request, res: Response) {
    try {
      const { ticketIds } = req.body;

      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ message: 'Invalid ticket IDs' });
      }

      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Update the selected tickets to 'won' status
        await connection.query(`
          UPDATE tickets 
          SET status = 'won', 
              updated_at = NOW() 
          WHERE id IN (?)
        `, [ticketIds]);

        // Get the updated tickets
        const [winners] = await connection.query<RowDataPacket[]>(`
          SELECT 
            t.id,
            t.ticket_id,
            t.user_id,
            t.game_id,
            u.username,
            u.mobile_no,
            t.stake_amt,
            t.potential_winning,
            t.created_at,
            t.draw_time,
            t.draw_date,
            t.status,
            t.status as ticket_status
          FROM tickets t
          JOIN users u ON t.user_id = u.id
          WHERE t.id IN (?)
        `, [ticketIds]);

        // Commit the transaction
        await connection.commit();

        res.json({
          message: `Successfully picked ${winners.length} winners`,
          winners
        });
      } catch (error) {
        // Rollback in case of error
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error picking winners:', error);
      res.status(500).json({ message: 'Error picking winners' });
    }
  }
} 