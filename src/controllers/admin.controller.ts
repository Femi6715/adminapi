import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { environment } from '../config/environment';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader, OkPacket } from 'mysql2';

interface Admin extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  created_at: Date;
}

interface User extends RowDataPacket {
  id: number;
  username: string;
  firstname: string;
  surname: string;
  state: string;
  email: string;
  mobile_no: string;
  main_balance: number;
  bonus: number;
  createdAt: Date;
  updatedAt: Date;
  is_banned: number;
}

interface Ticket extends RowDataPacket {
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

interface ActivityLog extends RowDataPacket {
  id: number;
  admin_id: number;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
  admin_name?: string;
}

interface CountResult extends RowDataPacket {
  total: number;
}

interface TransferRecipient extends RowDataPacket {
  id: number;
  user_id: number;
  recipient_code: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  created_at: string;
  username?: string;
}

export class AdminController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      const [rows] = await pool.query<Admin[]>(
        'SELECT * FROM admins WHERE username = ?',
        [username]
      );

      const admin = rows[0];
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const payload = { id: admin.id, username: admin.username };
      const options: SignOptions = { expiresIn: 86400 }; // 24 hours in seconds
      
      const token = jwt.sign(payload, environment.jwt.secret, options);

      res.json({ token, admin: { id: admin.id, username: admin.username } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const [rows] = await pool.query<Admin[]>(
        'SELECT id, username, email, role, created_at FROM admins WHERE id = ?',
        [req.user?.id]
      );
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const [userCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
      const [activeUsers] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users WHERE is_banned = 0');
      res.json({ totalUsers: userCount[0].count, activeUsers: activeUsers[0].count });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching stats' });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      console.log('Fetching users from database...');
      // Check column names
      const [columns] = await pool.query<RowDataPacket[]>(`SHOW COLUMNS FROM users`);
      console.log('Database columns:', columns.map((col: any) => col.Field));
      
      // Modify the query to inspect values more carefully
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          id,
          username,
          IFNULL(firstname, '') as firstname,
          IFNULL(surname, '') as surname,
          IFNULL(state, '') as state,
          IFNULL(email, '') as email,
          IFNULL(mobile_no, '') as mobile_no,
          IFNULL(main_balance, 0.00) as main_balance,
          IFNULL(bonus, 0.00) as bonus,
          DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') as createdAt,
          DATE_FORMAT(updatedAt, '%Y-%m-%d %H:%i:%s') as updatedAt,
          IFNULL(is_banned, 0) as is_banned
        FROM users
        ORDER BY id DESC
      `);
      
      console.log('Raw database row count:', rows.length); 
      if (rows.length > 0) {
        console.log('First row raw data:', JSON.stringify(rows[0]));
        console.log('First row keys:', Object.keys(rows[0]));
        console.log('Field check - firstname:', rows[0].firstname, typeof rows[0].firstname);
        console.log('Field check - surname:', rows[0].surname, typeof rows[0].surname);
        console.log('Field check - state:', rows[0].state, typeof rows[0].state);
        console.log('Field check - mobile_no:', rows[0].mobile_no, typeof rows[0].mobile_no);
      }

      // Transform the data to match frontend interface
      const transformedRows = (rows as RowDataPacket[]).map((row) => {
        const transformed = {
          id: row.id,
          username: row.username,
          firstname: row.firstname || '',
          surname: row.surname || '',
          state: row.state || '',
          email: row.email || '',
          mobile_no: row.mobile_no || '',
          main_balance: row.main_balance?.toString() || '0.00',
          bonus: row.bonus?.toString() || '0.00',
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          is_banned: row.is_banned
        };
        return transformed;
      });

      if (transformedRows.length > 0) {
        console.log('First transformed row:', JSON.stringify(transformedRows[0]));
        console.log('First transformed row keys:', Object.keys(transformedRows[0]));
      }
      
      res.json(transformedRows);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      await pool.query<ResultSetHeader>('DELETE FROM users WHERE username = ?', [username]);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user' });
    }
  }

  async banUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      await pool.query<ResultSetHeader>('UPDATE users SET is_banned = 1 WHERE username = ?', [username]);
      res.json({ message: 'User banned successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error banning user' });
    }
  }

  async unbanUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      await pool.query<ResultSetHeader>('UPDATE users SET is_banned = 0 WHERE username = ?', [username]);
      res.json({ message: 'User unbanned successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error unbanning user' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const { firstName, lastName, email, phoneNumber, mainBalance, bonus } = req.body;

      // Update user in database
      await pool.query<ResultSetHeader>(
        `UPDATE users 
         SET firstname = ?, 
             surname = ?, 
             email = ?, 
             mobile_no = ?, 
             main_balance = ?, 
             bonus = ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE username = ?`,
        [firstName, lastName, email, phoneNumber, mainBalance, bonus, username]
      );

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  }

  async getTickets(req: Request, res: Response) {
    try {
      const [tickets] = await pool.query<Ticket[]>(`
        SELECT t.*, u.username 
        FROM tickets t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `);
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ message: 'Error fetching tickets' });
    }
  }

  async getWeeklyTickets(req: Request, res: Response) {
    try {
      // Get the current date
      const now = new Date();
      
      // Get the most recent Sunday (start of week)
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - now.getDay());
      sunday.setHours(0, 0, 0, 0);

      const [tickets] = await pool.query<Ticket[]>(`
        SELECT 
          t.id,
          t.ticket_id,
          t.user_id,
          t.game_id,
          u.username,
          u.mobile_no,
          t.stake_amt,
          t.potential_winning,
          t.draw_time,
          t.draw_date,
          t.ticket_status,
          t.created_at
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.created_at >= ?
        AND t.ticket_status = 'pending'
        ORDER BY t.created_at DESC
      `, [sunday]);

      // Randomly select winners (20% of tickets)
      const winners = this.selectRandomWinners(tickets, 0.2);
      
      res.json({ tickets, winners });
    } catch (error) {
      console.error('Error fetching weekly tickets:', error);
      res.status(500).json({ message: 'Error fetching weekly tickets' });
    }
  }

  async getMonthlyTickets(req: Request, res: Response) {
    try {
      // Get the current date
      const now = new Date();
      
      // Get the first day of the current month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const [tickets] = await pool.query<Ticket[]>(`
        SELECT 
          t.id,
          t.ticket_id,
          t.user_id,
          t.game_id,
          u.username,
          u.mobile_no,
          t.stake_amt,
          t.potential_winning,
          t.draw_time,
          t.draw_date,
          t.ticket_status,
          t.created_at
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.created_at >= ?
        AND t.ticket_status = 'pending'
        ORDER BY t.created_at DESC
      `, [firstDayOfMonth]);

      // Randomly select winners (20% of tickets)
      const winners = this.selectRandomWinners(tickets, 0.2);
      
      res.json({ tickets, winners });
    } catch (error) {
      console.error('Error fetching monthly tickets:', error);
      res.status(500).json({ message: 'Error fetching monthly tickets' });
    }
  }

  // Helper method to randomly select winners
  private selectRandomWinners(tickets: Ticket[], percentage: number): Ticket[] {
    if (!tickets.length) return [];
    
    const numWinners = Math.max(1, Math.floor(tickets.length * percentage));
    const shuffled = [...tickets].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numWinners);
  }

  async getTicketsByDateRange(req: Request, res: Response) {
    try {
      const { fromDate, toDate } = req.query;
      
      if (!fromDate || !toDate) {
        return res.status(400).json({ message: 'fromDate and toDate are required' });
      }

      const [tickets] = await pool.query<Ticket[]>(`
        SELECT 
          t.id,
          t.ticket_id,
          t.user_id,
          t.game_id,
          u.username,
          u.mobile_no,
          t.stake_amt,
          t.potential_winning,
          t.draw_time,
          t.draw_date,
          t.ticket_status,
          t.created_at
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.created_at BETWEEN ? AND ?
        AND t.ticket_status = 'pending'
        ORDER BY t.created_at DESC
      `, [fromDate, toDate]);
      
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets by date range:', error);
      res.status(500).json({ message: 'Error fetching tickets by date range' });
    }
  }

  async pickWinners(req: Request, res: Response) {
    try {
      const { ticketIds } = req.body;
      const numberOfWinners = 1; // Set to 1 winner
      const adminId = req.user?.id;

      if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ message: 'No ticket IDs provided' });
      }

      if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Get all tickets
      const [rows] = await pool.query<Ticket[]>(
        `SELECT t.*, u.username 
         FROM tickets t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.id IN (?) AND t.ticket_status = 'pending'`,
        [ticketIds]
      );
      const tickets = rows as Ticket[];

      if (tickets.length === 0) {
        return res.status(404).json({ message: 'No pending tickets found' });
      }

      // Select random winner(s)
      const winners = [];
      const availableTickets = [...tickets];
      
      for (let i = 0; i < numberOfWinners && availableTickets.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableTickets.length);
        const winner = availableTickets.splice(randomIndex, 1)[0];
        winners.push(winner);
      }

      // Update winner status in database
      const winnerIds = winners.map(w => w.id);
      await pool.query(
        `UPDATE tickets 
         SET ticket_status = 'won' 
         WHERE id IN (?)`,
        [winnerIds]
      );

      // Log the activity
      await pool.query(
        `INSERT INTO activity_logs (admin_id, action, details) 
         VALUES (?, ?, ?)`,
        [adminId, 'pick_winners', JSON.stringify({ winnerIds })]
      );

      return res.json({
        message: 'Winners picked successfully',
        winners: winners
      });
    } catch (error) {
      console.error('Error picking winners:', error);
      return res.status(500).json({ message: 'Error picking winners' });
    }
  }

  async logActivity(adminId: number, action: string, details: string, ipAddress: string): Promise<void> {
    const query = `
      INSERT INTO activity_logs (admin_id, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `;
    await pool.query(query, [adminId, action, details, ipAddress]);
  }

  async getActivityLogs(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.query<ActivityLog[]>(
        `SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM activity_logs'
      );

      return {
        data: rows as ActivityLog[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  async getActivityLogsByDateRange(startDate: string, endDate: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.query<ActivityLog[]>(
        `SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        WHERE al.created_at BETWEEN ? AND ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`,
        [startDate, endDate, limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM activity_logs WHERE created_at BETWEEN ? AND ?',
        [startDate, endDate]
      );

      return {
        data: rows as ActivityLog[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error fetching activity logs by date range:', error);
      throw error;
    }
  }

  async getActivityLogsByAdmin(adminId: number, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.query<ActivityLog[]>(
        `SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        WHERE al.admin_id = ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`,
        [adminId, limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM activity_logs WHERE admin_id = ?',
        [adminId]
      );

      return {
        data: rows as ActivityLog[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error fetching activity logs by admin:', error);
      throw error;
    }
  }

  async searchActivityLogs(query: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      const searchPattern = `%${query}%`;
      
      const [rows] = await pool.query<ActivityLog[]>(
        `SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        WHERE al.action LIKE ? OR al.details LIKE ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`,
        [searchPattern, searchPattern, limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM activity_logs WHERE action LIKE ? OR details LIKE ?',
        [searchPattern, searchPattern]
      );

      return {
        data: rows as ActivityLog[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error searching activity logs:', error);
      throw error;
    }
  }

  async getTransferRecipients(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.query<TransferRecipient[]>(
        `SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM transfer_recipients'
      );

      return {
        data: rows as TransferRecipient[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error fetching transfer recipients:', error);
      throw error;
    }
  }

  async getTransferRecipientsByDateRange(startDate: string, endDate: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.query<TransferRecipient[]>(
        `SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.created_at BETWEEN ? AND ?
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`,
        [startDate, endDate, limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM transfer_recipients WHERE created_at BETWEEN ? AND ?',
        [startDate, endDate]
      );

      return {
        data: rows as TransferRecipient[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error fetching transfer recipients by date range:', error);
      throw error;
    }
  }

  async getTransferRecipientsByUser(userId: number, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.query<TransferRecipient[]>(
        `SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.user_id = ?
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM transfer_recipients WHERE user_id = ?',
        [userId]
      );

      return {
        data: rows as TransferRecipient[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error fetching transfer recipients by user:', error);
      throw error;
    }
  }

  async searchTransferRecipients(query: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;
      const searchPattern = `%${query}%`;
      
      const [rows] = await pool.query<TransferRecipient[]>(
        `SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.account_name LIKE ? OR tr.account_number LIKE ?
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`,
        [searchPattern, searchPattern, limit, offset]
      );

      const [totalRows] = await pool.query<CountResult[]>(
        'SELECT COUNT(*) as total FROM transfer_recipients WHERE account_name LIKE ? OR account_number LIKE ?',
        [searchPattern, searchPattern]
      );

      return {
        data: rows as TransferRecipient[],
        total: (totalRows as CountResult[])[0].total
      };
    } catch (error) {
      console.error('Error searching transfer recipients:', error);
      throw error;
    }
  }
} 