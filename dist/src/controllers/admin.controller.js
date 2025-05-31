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
}
exports.AdminController = AdminController;
