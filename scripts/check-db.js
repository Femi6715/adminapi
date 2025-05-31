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
const promise_1 = __importDefault(require("mysql2/promise"));
const pool = promise_1.default.createPool({
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
function checkTables() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // Check if tables exist
            const [tables] = yield pool.query('SHOW TABLES');
            console.log('Tables in database:', tables);
            // Check structure of tickets table
            const [ticketsStructure] = yield pool.query('DESCRIBE tickets');
            console.log('Tickets table structure:', ticketsStructure);
            // Check structure of transactions table
            const [transactionsStructure] = yield pool.query('DESCRIBE transactions');
            console.log('Transactions table structure:', transactionsStructure);
            // Check for data in tickets
            const [tickets] = yield pool.query('SELECT COUNT(*) as count FROM tickets');
            console.log('Tickets count:', (_a = tickets[0]) === null || _a === void 0 ? void 0 : _a.count);
            // Check for data in transactions
            const [transactions] = yield pool.query('SELECT COUNT(*) as count FROM transactions');
            console.log('Transactions count:', (_b = transactions[0]) === null || _b === void 0 ? void 0 : _b.count);
        }
        catch (error) {
            console.error('Error checking database:', error);
        }
        finally {
            yield pool.end();
        }
    });
}
checkTables();
