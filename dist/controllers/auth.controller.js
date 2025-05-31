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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
class AuthController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                // Get user from database
                const [users] = yield database_1.pool.query('SELECT * FROM users WHERE username = ?', [username]);
                if (users.length === 0) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                const user = users[0];
                // Check if user is banned (MySQL returns 1 for true, 0 for false)
                if (user.is_banned === 1) {
                    return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
                }
                // Verify password
                const isValidPassword = yield bcrypt_1.default.compare(password, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
                // Generate JWT token
                const token = jsonwebtoken_1.default.sign({
                    id: user.id,
                    username: user.username,
                    role: user.role
                }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
                res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role
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
exports.default = new AuthController();
