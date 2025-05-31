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
exports.TransactionsModel = void 0;
const database_1 = require("../config/database");
class TransactionsModel {
    getAllTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Executing getAllTransactions query');
                const [rows] = yield database_1.pool.query('SELECT * FROM transactions ORDER BY createdAt DESC');
                console.log('Query result:', rows);
                return rows;
            }
            catch (error) {
                console.error('Error in getAllTransactions:', error);
                throw error;
            }
        });
    }
    getTransactionById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Executing getTransactionById query for:', id);
                const [rows] = yield database_1.pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
                const transactions = rows;
                console.log('Query result:', transactions);
                return transactions.length > 0 ? transactions[0] : null;
            }
            catch (error) {
                console.error('Error in getTransactionById:', error);
                throw error;
            }
        });
    }
    updateTransactionStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Executing updateTransactionStatus query for:', id, 'status:', status);
                const [result] = yield database_1.pool.query('UPDATE transactions SET status = ? WHERE id = ?', [status, id]);
                console.log('Update result:', result);
                return result.affectedRows > 0;
            }
            catch (error) {
                console.error('Error in updateTransactionStatus:', error);
                throw error;
            }
        });
    }
}
exports.TransactionsModel = TransactionsModel;
