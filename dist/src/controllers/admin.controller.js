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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../../config/environment");
const database_1 = require("../config/database");
class AdminController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                const [rows] = yield database_1.pool.query('SELECT * FROM admins WHERE username = ?', [username]);
                const admin = rows[0];
                if (!admin) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                const validPassword = yield bcrypt_1.default.compare(password, admin.password);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                const payload = { id: admin.id, username: admin.username };
                const options = { expiresIn: 86400 }; // 24 hours in seconds
                const token = jsonwebtoken_1.default.sign(payload, environment_1.environment.jwt.secret, options);
                res.json({ token, admin: { id: admin.id, username: admin.username } });
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ message: 'Error during login' });
            }
        });
    }
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const [rows] = yield database_1.pool.query('SELECT id, username, email, role, created_at FROM admins WHERE id = ?', [(_a = req.user) === null || _a === void 0 ? void 0 : _a.id]);
                res.json(rows[0]);
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching profile' });
            }
        });
    }
    getStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [userCount] = yield database_1.pool.query('SELECT COUNT(*) as count FROM users');
                const [activeUsers] = yield database_1.pool.query('SELECT COUNT(*) as count FROM users WHERE is_banned = 0');
                res.json({ totalUsers: userCount[0].count, activeUsers: activeUsers[0].count });
            }
            catch (error) {
                res.status(500).json({ message: 'Error fetching stats' });
            }
        });
    }
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Fetching users from database...');
                // Check column names
                const [columns] = yield database_1.pool.query(`SHOW COLUMNS FROM users`);
                console.log('Database columns:', columns.map((col) => col.Field));
                // Modify the query to inspect values more carefully
                const [rows] = yield database_1.pool.query(`
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
                const transformedRows = rows.map((row) => {
                    var _a, _b;
                    const transformed = {
                        id: row.id,
                        username: row.username,
                        firstname: row.firstname || '',
                        surname: row.surname || '',
                        state: row.state || '',
                        email: row.email || '',
                        mobile_no: row.mobile_no || '',
                        main_balance: ((_a = row.main_balance) === null || _a === void 0 ? void 0 : _a.toString()) || '0.00',
                        bonus: ((_b = row.bonus) === null || _b === void 0 ? void 0 : _b.toString()) || '0.00',
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
            }
            catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                yield database_1.pool.query('DELETE FROM users WHERE username = ?', [username]);
                res.json({ message: 'User deleted successfully' });
            }
            catch (error) {
                res.status(500).json({ message: 'Error deleting user' });
            }
        });
    }
    banUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                yield database_1.pool.query('UPDATE users SET is_banned = 1 WHERE username = ?', [username]);
                res.json({ message: 'User banned successfully' });
            }
            catch (error) {
                res.status(500).json({ message: 'Error banning user' });
            }
        });
    }
    unbanUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                yield database_1.pool.query('UPDATE users SET is_banned = 0 WHERE username = ?', [username]);
                res.json({ message: 'User unbanned successfully' });
            }
            catch (error) {
                res.status(500).json({ message: 'Error unbanning user' });
            }
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                const { firstName, lastName, email, phoneNumber, mainBalance, bonus } = req.body;
                // Update user in database
                yield database_1.pool.query(`UPDATE users 
         SET firstname = ?, 
             surname = ?, 
             email = ?, 
             mobile_no = ?, 
             main_balance = ?, 
             bonus = ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE username = ?`, [firstName, lastName, email, phoneNumber, mainBalance, bonus, username]);
                res.json({ message: 'User updated successfully' });
            }
            catch (error) {
                console.error('Error updating user:', error);
                res.status(500).json({ message: 'Error updating user' });
            }
        });
    }
    getTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [tickets] = yield database_1.pool.query(`
        SELECT t.*, u.username 
        FROM tickets t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `);
                res.json(tickets);
            }
            catch (error) {
                console.error('Error fetching tickets:', error);
                res.status(500).json({ message: 'Error fetching tickets' });
            }
        });
    }
    getWeeklyTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the current date
                const now = new Date();
                // Get the most recent Sunday (start of week)
                const sunday = new Date(now);
                sunday.setDate(now.getDate() - now.getDay());
                sunday.setHours(0, 0, 0, 0);
                const [tickets] = yield database_1.pool.query(`
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
            }
            catch (error) {
                console.error('Error fetching weekly tickets:', error);
                res.status(500).json({ message: 'Error fetching weekly tickets' });
            }
        });
    }
    getMonthlyTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get the current date
                const now = new Date();
                // Get the first day of the current month
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                firstDayOfMonth.setHours(0, 0, 0, 0);
                const [tickets] = yield database_1.pool.query(`
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
            }
            catch (error) {
                console.error('Error fetching monthly tickets:', error);
                res.status(500).json({ message: 'Error fetching monthly tickets' });
            }
        });
    }
    // Helper method to randomly select winners
    selectRandomWinners(tickets, percentage) {
        if (!tickets.length)
            return [];
        const numWinners = Math.max(1, Math.floor(tickets.length * percentage));
        const shuffled = [...tickets].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numWinners);
    }
    getTicketsByDateRange(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fromDate, toDate } = req.query;
                if (!fromDate || !toDate) {
                    return res.status(400).json({ message: 'fromDate and toDate are required' });
                }
                const [tickets] = yield database_1.pool.query(`
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
            }
            catch (error) {
                console.error('Error fetching tickets by date range:', error);
                res.status(500).json({ message: 'Error fetching tickets by date range' });
            }
        });
    }
    pickWinners(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { ticketIds } = req.body;
                const numberOfWinners = 1; // Set to 1 winner
                const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
                    return res.status(400).json({ message: 'No ticket IDs provided' });
                }
                if (!adminId) {
                    return res.status(401).json({ message: 'Unauthorized' });
                }
                // Get all tickets
                const [rows] = yield database_1.pool.query(`SELECT t.*, u.username 
         FROM tickets t 
         JOIN users u ON t.user_id = u.id 
         WHERE t.id IN (?) AND t.ticket_status = 'pending'`, [ticketIds]);
                const tickets = rows;
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
                yield database_1.pool.query(`UPDATE tickets 
         SET ticket_status = 'won' 
         WHERE id IN (?)`, [winnerIds]);
                // Log the activity
                yield database_1.pool.query(`INSERT INTO activity_logs (admin_id, action, details) 
         VALUES (?, ?, ?)`, [adminId, 'pick_winners', JSON.stringify({ winnerIds })]);
                return res.json({
                    message: 'Winners picked successfully',
                    winners: winners
                });
            }
            catch (error) {
                console.error('Error picking winners:', error);
                return res.status(500).json({ message: 'Error picking winners' });
            }
        });
    }
    logActivity(adminId, action, details, ipAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      INSERT INTO activity_logs (admin_id, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `;
            yield database_1.pool.query(query, [adminId, action, details, ipAddress]);
        });
    }
    getActivityLogs() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const [rows] = yield database_1.pool.query(`SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`, [limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM activity_logs');
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error fetching activity logs:', error);
                throw error;
            }
        });
    }
    getActivityLogsByDateRange(startDate_1, endDate_1) {
        return __awaiter(this, arguments, void 0, function* (startDate, endDate, page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const [rows] = yield database_1.pool.query(`SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        WHERE al.created_at BETWEEN ? AND ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`, [startDate, endDate, limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM activity_logs WHERE created_at BETWEEN ? AND ?', [startDate, endDate]);
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error fetching activity logs by date range:', error);
                throw error;
            }
        });
    }
    getActivityLogsByAdmin(adminId_1) {
        return __awaiter(this, arguments, void 0, function* (adminId, page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const [rows] = yield database_1.pool.query(`SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        WHERE al.admin_id = ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`, [adminId, limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM activity_logs WHERE admin_id = ?', [adminId]);
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error fetching activity logs by admin:', error);
                throw error;
            }
        });
    }
    searchActivityLogs(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const searchPattern = `%${query}%`;
                const [rows] = yield database_1.pool.query(`SELECT al.*, a.username as admin_name
        FROM activity_logs al
        LEFT JOIN admins a ON al.admin_id = a.id
        WHERE al.action LIKE ? OR al.details LIKE ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`, [searchPattern, searchPattern, limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM activity_logs WHERE action LIKE ? OR details LIKE ?', [searchPattern, searchPattern]);
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error searching activity logs:', error);
                throw error;
            }
        });
    }
    getTransferRecipients() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const [rows] = yield database_1.pool.query(`SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`, [limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM transfer_recipients');
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error fetching transfer recipients:', error);
                throw error;
            }
        });
    }
    getTransferRecipientsByDateRange(startDate_1, endDate_1) {
        return __awaiter(this, arguments, void 0, function* (startDate, endDate, page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const [rows] = yield database_1.pool.query(`SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.created_at BETWEEN ? AND ?
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`, [startDate, endDate, limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM transfer_recipients WHERE created_at BETWEEN ? AND ?', [startDate, endDate]);
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error fetching transfer recipients by date range:', error);
                throw error;
            }
        });
    }
    getTransferRecipientsByUser(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const [rows] = yield database_1.pool.query(`SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.user_id = ?
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`, [userId, limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM transfer_recipients WHERE user_id = ?', [userId]);
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error fetching transfer recipients by user:', error);
                throw error;
            }
        });
    }
    searchTransferRecipients(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, page = 1, limit = 10) {
            try {
                const offset = (page - 1) * limit;
                const searchPattern = `%${query}%`;
                const [rows] = yield database_1.pool.query(`SELECT tr.*, u.username
        FROM transfer_recipients tr
        LEFT JOIN users u ON tr.user_id = u.id
        WHERE tr.account_name LIKE ? OR tr.account_number LIKE ?
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?`, [searchPattern, searchPattern, limit, offset]);
                const [totalRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM transfer_recipients WHERE account_name LIKE ? OR account_number LIKE ?', [searchPattern, searchPattern]);
                return {
                    data: rows,
                    total: totalRows[0].total
                };
            }
            catch (error) {
                console.error('Error searching transfer recipients:', error);
                throw error;
            }
        });
    }
}
exports.AdminController = AdminController;
