"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const environment_1 = require("../../config/environment");
// Create the connection pool
exports.db = promise_1.default.createPool({
    host: environment_1.environment.database.host,
    port: environment_1.environment.database.port,
    user: environment_1.environment.database.user,
    password: environment_1.environment.database.password,
    database: environment_1.environment.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// Test the connection
exports.db.getConnection()
    .then(connection => {
    console.log('Database connected successfully');
    connection.release();
})
    .catch(err => {
    console.error('Error connecting to the database:', err);
});
