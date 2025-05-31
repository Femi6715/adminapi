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
const database_1 = require("../config/database");
const environment_1 = require("../config/environment");
class AdminController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                // Get admin from database
                const [rows] = yield database_1.pool.query('SELECT * FROM admins WHERE username = ?', [username]);
                const admin = rows[0];
                if (!admin) {
                    res.status(401).json({ message: 'Invalid credentials' });
                    return;
                }
                // Check password
                const validPassword = yield bcrypt_1.default.compare(password, admin.password);
                if (!validPassword) {
                    res.status(401).json({ message: 'Invalid credentials' });
                    return;
                }
                // Generate JWT token
                const payload = { id: admin.id, username: admin.username };
                const options = { expiresIn: 3600 }; // 1 hour in seconds
                const secret = Buffer.from(environment_1.environment.jwt.secret, 'utf-8');
                const token = jsonwebtoken_1.default.sign(payload, secret, options);
                res.json({
                    message: 'Login successful',
                    token,
                    admin: {
                        id: admin.id,
                        username: admin.username
                    }
                });
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ message: 'Error during login' });
            }
        });
    }
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // The user ID is available from the auth middleware
                const userId = req.user.id;
                const [rows] = yield database_1.pool.query('SELECT id, username, created_at FROM admins WHERE id = ?', [userId]);
                const admin = rows[0];
                if (!admin) {
                    res.status(404).json({ message: 'Admin not found' });
                    return;
                }
                res.json({ admin });
            }
            catch (error) {
                console.error('Get profile error:', error);
                res.status(500).json({ message: 'Error getting profile' });
            }
        });
    }
    getStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get total registered users
                const [userRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM users');
                const totalUsers = userRows[0]['total'];
                // Get total tickets
                const [ticketRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM tickets');
                const totalTickets = ticketRows[0]['total'];
                // Get total transactions
                const [transactionRows] = yield database_1.pool.query('SELECT COUNT(*) as total FROM transactions');
                const totalTransactions = transactionRows[0]['total'];
                // Get total stake amount
                const [stakeRows] = yield database_1.pool.query('SELECT COALESCE(SUM(stake_amt), 0) as total FROM tickets');
                const totalStakeAmount = stakeRows[0]['total'];
                // Get total potential winnings
                const [winningRows] = yield database_1.pool.query('SELECT COALESCE(SUM(potential_winning), 0) as total FROM tickets');
                const totalPotentialWinnings = winningRows[0]['total'];
                // Get total transaction amount
                const [transactionAmountRows] = yield database_1.pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = "completed"');
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
            }
            catch (error) {
                console.error('Error getting stats:', error);
                res.status(500).json({ message: 'Error getting dashboard statistics' });
            }
        });
    }
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [rows] = yield database_1.pool.query(`
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
            }
            catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
    }
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                const { firstName, lastName, email, phoneNumber, mainBalance, bonus } = req.body;
                console.log('Update request received:', {
                    username,
                    body: req.body,
                    params: req.params
                });
                // First check if user exists with more detailed query
                const [userRows] = yield database_1.pool.query('SELECT username, firstname, surname, email FROM users WHERE LOWER(username) = LOWER(?)', [username]);
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
                    (firstName === null || firstName === void 0 ? void 0 : firstName.trim()) || null,
                    (lastName === null || lastName === void 0 ? void 0 : lastName.trim()) || null,
                    (email === null || email === void 0 ? void 0 : email.trim()) || null,
                    (phoneNumber === null || phoneNumber === void 0 ? void 0 : phoneNumber.trim()) || null,
                    mainBalance ? parseFloat(mainBalance.toString()) : 0,
                    bonus ? parseFloat(bonus.toString()) : 0,
                    username
                ];
                console.log('Executing update query:', {
                    query: updateQuery,
                    params: queryParams
                });
                // Update user in database
                const [result] = yield database_1.pool.query(updateQuery, queryParams);
                console.log('Update result:', result);
                // Return the updated user data with consistent field names
                const [updatedUser] = yield database_1.pool.query(`SELECT 
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
        WHERE LOWER(username) = LOWER(?)`, [username]);
                if (!updatedUser[0]) {
                    throw new Error('Failed to retrieve updated user data');
                }
                res.json({
                    message: 'User updated successfully',
                    user: updatedUser[0]
                });
            }
            catch (error) {
                console.error('Error updating user:', error);
                res.status(500).json({
                    message: 'Internal server error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    code: 'UPDATE_ERROR'
                });
            }
        });
    }
    banUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                console.log('Ban request received for user:', username);
                // First check if user exists
                const [userRows] = yield database_1.pool.query('SELECT username FROM users WHERE username = ?', [username]);
                console.log('User check result:', userRows);
                if (userRows.length === 0) {
                    console.log('User not found:', username);
                    return res.status(404).json({ message: 'User not found' });
                }
                // Update user's ban status
                const [result] = yield database_1.pool.query('UPDATE users SET is_banned = 1 WHERE username = ?', [username]);
                console.log('Ban update result:', result);
                res.json({ message: 'User banned successfully' });
            }
            catch (error) {
                console.error('Error banning user:', error);
                res.status(500).json({
                    message: 'Error banning user',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    unbanUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username } = req.params;
                console.log('Unban request received for user:', username);
                // First check if user exists
                const [userRows] = yield database_1.pool.query('SELECT username FROM users WHERE username = ?', [username]);
                console.log('User check result:', userRows);
                if (userRows.length === 0) {
                    console.log('User not found:', username);
                    return res.status(404).json({ message: 'User not found' });
                }
                // Update user's ban status
                const [result] = yield database_1.pool.query('UPDATE users SET is_banned = 0 WHERE username = ?', [username]);
                console.log('Unban update result:', result);
                res.json({ message: 'User unbanned successfully' });
            }
            catch (error) {
                console.error('Error unbanning user:', error);
                res.status(500).json({
                    message: 'Error unbanning user',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    getWeeklyTickets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const [rows] = yield database_1.pool.query(`
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
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const [rows] = yield database_1.pool.query(`
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
            }
            catch (error) {
                console.error('Error fetching monthly tickets:', error);
                res.status(500).json({ message: 'Error fetching monthly tickets' });
            }
        });
    }
    getTicketsByDateRange(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { fromDate, toDate } = req.query;
                if (!fromDate || !toDate) {
                    return res.status(400).json({ message: 'From date and to date are required' });
                }
                const [rows] = yield database_1.pool.query(`
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
            }
            catch (error) {
                console.error('Error fetching tickets by date range:', error);
                res.status(500).json({ message: 'Error fetching tickets by date range' });
            }
        });
    }
    pickWinners(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { ticketIds } = req.body;
                if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
                    return res.status(400).json({ message: 'Invalid ticket IDs' });
                }
                // Start a transaction
                const connection = yield database_1.pool.getConnection();
                yield connection.beginTransaction();
                try {
                    // Update the selected tickets to 'won' status
                    yield connection.query(`
          UPDATE tickets 
          SET status = 'won', 
              updated_at = NOW() 
          WHERE id IN (?)
        `, [ticketIds]);
                    // Get the updated tickets
                    const [winners] = yield connection.query(`
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
                    yield connection.commit();
                    res.json({
                        message: `Successfully picked ${winners.length} winners`,
                        winners
                    });
                }
                catch (error) {
                    // Rollback in case of error
                    yield connection.rollback();
                    throw error;
                }
                finally {
                    connection.release();
                }
            }
            catch (error) {
                console.error('Error picking winners:', error);
                res.status(500).json({ message: 'Error picking winners' });
            }
        });
    }
}
exports.AdminController = AdminController;
