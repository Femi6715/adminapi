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
const transactions_model_1 = require("../models/transactions.model");
class TransactionsController {
    constructor() {
        this.getTransactions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log('\n=== getTransactions called ===');
            console.log('Request URL:', req.url);
            console.log('Request method:', req.method);
            console.log('Request headers:', req.headers);
            console.log('Request params:', req.params);
            console.log('Request query:', req.query);
            try {
                console.log('Calling transactionsModel.getAllTransactions()');
                const transactions = yield this.transactionsModel.getAllTransactions();
                const transactionsArray = transactions;
                console.log('Transactions retrieved successfully, count:', transactionsArray ? transactionsArray.length : 0);
                console.log('First transaction (if any):', transactionsArray && transactionsArray.length > 0 ? transactionsArray[0] : 'No transactions found');
                if (!transactionsArray || transactionsArray.length === 0) {
                    console.log('No transactions found in database');
                    return res.status(404).json({ error: 'No transactions found' });
                }
                res.json({ transactions: transactions });
            }
            catch (error) {
                console.error('Error fetching transactions:', error);
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        });
        this.getTransactionById = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id, 10);
                const transaction = yield this.transactionsModel.getTransactionById(id);
                if (!transaction) {
                    return res.status(404).json({ error: 'Transaction not found' });
                }
                res.json({ transaction });
            }
            catch (error) {
                console.error('Error fetching transaction:', error);
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        });
        this.updateTransactionStatus = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = parseInt(req.params.id, 10);
                const { status } = req.body;
                if (!status || !['pending', 'completed', 'failed'].includes(status)) {
                    return res.status(400).json({ error: 'Invalid status' });
                }
                const success = yield this.transactionsModel.updateTransactionStatus(id, status);
                if (!success) {
                    return res.status(404).json({ error: 'Transaction not found' });
                }
                res.json({ message: 'Transaction status updated successfully' });
            }
            catch (error) {
                console.error('Error updating transaction status:', error);
                res.status(500).json({ error: 'Internal server error', details: error.message });
            }
        });
        this.transactionsModel = new transactions_model_1.TransactionsModel();
        console.log('TransactionsController initialized');
    }
}
exports.TransactionsController = TransactionsController;
