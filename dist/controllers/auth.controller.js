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
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = require("../config/database");
class AuthController {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password, email, first_name, last_name, phone_number } = req.body;
                // Check if user already exists
                const [existingUsers] = yield database_1.pool.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
                if (existingUsers.length > 0) {
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
                // Hash password
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                // Insert new user
                yield database_1.pool.query('INSERT INTO users (username, password, email, first_name, last_name, phone_number) VALUES (?, ?, ?, ?, ?, ?)', [username, hashedPassword, email, first_name, last_name, phone_number]);
                res.status(201).json({ message: 'User registered successfully' });
            }
            catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ message: 'Error during registration' });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                const [rows] = yield database_1.pool.query('SELECT * FROM users WHERE username = ?', [username]);
                const user = rows[0];
                if (!user) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                const validPassword = yield bcrypt_1.default.compare(password, user.password);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                if (user.is_banned) {
                    return res.status(403).json({ message: 'Account is banned' });
                }
                res.json({
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        phone_number: user.phone_number,
                        main_balance: user.main_balance,
                        bonus: user.bonus
                    }
                });
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ message: 'Error during login' });
            }
        });
    }
}
exports.AuthController = AuthController;
