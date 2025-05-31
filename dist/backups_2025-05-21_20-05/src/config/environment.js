"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Log environment variables for debugging
console.log('Database Config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
});
exports.environment = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        host: process.env.DB_HOST || '9hej2.h.filess.io',
        port: parseInt(process.env.DB_PORT || '3307'),
        user: process.env.DB_USER || 'MISGAPMS_unknownwar',
        password: process.env.DB_PASSWORD || '0fec82a33055d994e14f8717b63e1b56d74a149d',
        database: process.env.DB_NAME || 'MISGAPMS_unknownwar'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-development-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
    }
};
