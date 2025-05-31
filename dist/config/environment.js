"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Log environment
console.log('=== Loading Environment Variables ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('=====================');
// Create environment configuration
exports.environment = {
    port: parseInt(process.env.PORT || '3000', 10),
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
    },
    database: {
        host: process.env.DB_HOST || '9hej2.h.filess.io',
        port: parseInt(process.env.DB_PORT || '3307', 10),
        user: process.env.DB_USER || 'MISGAPMS_unknownwar',
        password: process.env.DB_PASSWORD || '0fec82a33055d994e14f8717b63e1b56d74a149d',
        name: process.env.DB_NAME || 'MISGAPMS_unknownwar'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
};
