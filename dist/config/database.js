"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
// Create the connection pool
exports.pool = promise_1.default.createPool({
    host: '27gi4.h.filess.io',
    port: 3307,
    user: 'Padilotto_wordrushof',
    password: 'd030caf65b4e0827f462ebbca5a2aaeff45bf969',
    database: 'Padilotto_wordrushof',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});
// Test the connection
exports.pool.getConnection()
    .then(connection => {
    console.log('Database connected successfully');
    connection.release();
})
    .catch(err => {
    console.error('Error connecting to the database:', err);
});
