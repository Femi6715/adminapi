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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const database_1 = require("../config/database");
class TransactionsController {
    getTransactions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Attempting to fetch transactions...');
                const [rows] = yield database_1.pool.query('SELECT * FROM transactions ORDER BY updatedAt DESC');
                console.log('Successfully fetched transactions:', rows.length);
                res.json({ transactions: rows });
            }
            catch (error) {
                console.error('Error fetching transactions:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    if (error.message.includes('Table')) {
                        res.status(404).json({ message: 'Transactions table not found in database' });
                    }
                    else {
                        res.status(500).json({ message: 'Error fetching transactions', details: error.message });
                    }
                }
                else {
                    res.status(500).json({ message: 'Unknown error fetching transactions' });
                }
            }
        });
    }
    getTransaction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                console.log('Attempting to fetch transaction with ID:', id);
                const [rows] = yield database_1.pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
                if (rows.length === 0) {
                    res.status(404).json({ message: 'Transaction not found' });
                    return;
                }
                console.log('Successfully fetched transaction');
                res.json(rows[0]);
            }
            catch (error) {
                console.error('Error fetching transaction:', error);
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                    if (error.message.includes('Table')) {
                        res.status(404).json({ message: 'Transactions table not found in database' });
                    }
                    else {
                        res.status(500).json({ message: 'Error fetching transaction', details: error.message });
                    }
                }
                else {
                    res.status(500).json({ message: 'Unknown error fetching transaction' });
                }
            }
        });
    }
}
exports.TransactionsController = TransactionsController;
