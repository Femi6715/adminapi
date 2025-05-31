"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../../config/environment");
const authMiddleware = (req, res, next) => {
    console.log('Auth middleware - Request received');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    try {
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);
        if (!authHeader) {
            console.log('No authorization header');
            return res.status(401).json({ message: 'No authorization header' });
        }
        const token = authHeader.split(' ')[1];
        console.log('Token:', token ? 'Present' : 'Missing');
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.environment.jwt.secret);
        console.log('Token decoded:', decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
