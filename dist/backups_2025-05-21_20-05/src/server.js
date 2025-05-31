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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const environment_1 = require("../config/environment");
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const database_1 = require("../src/config/database");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// CORS configuration
app.use((0, cors_1.default)({
    origin: environment_1.environment.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Enhanced logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    console.log('\n=== Incoming Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Original URL:', req.originalUrl);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Query:', req.query);
    console.log('Params:', req.params);
    // Capture the response
    const oldSend = res.send;
    res.send = function (data) {
        console.log('\n=== Outgoing Response ===');
        console.log('Status:', res.statusCode);
        console.log('Response time:', Date.now() - start, 'ms');
        console.log('Response body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
        console.log('=====================\n');
        return oldSend.call(res, data);
    };
    next();
});
// Routes
console.log('\n=== Mounting Routes ===');
// Root route
app.get('/', (req, res) => {
    console.log('Root route hit!');
    res.json({ message: 'Server is running' });
});
// Test routes
app.get('/api/test', (req, res) => {
    console.log('Test route hit!');
    res.json({ message: 'Server is working' });
});
// Mount admin routes (which includes tickets routes)
console.log('Mounting admin routes at /api/admin');
app.use('/api/admin', admin_routes_1.default);
// Test database connection
app.get('/api/test-db', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [result] = yield database_1.pool.query('SELECT 1 as test');
        res.json({ message: 'Database connection successful', result });
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
}));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});
console.log('Routes mounted successfully');
console.log('=====================\n');
// Error handling
app.use(error_middleware_1.errorHandler);
// Start server
const PORT = environment_1.environment.port;
app.listen(PORT, () => {
    console.log('=== Server Started ===');
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`CORS origin: ${environment_1.environment.cors.origin}`);
    console.log('=====================');
});
