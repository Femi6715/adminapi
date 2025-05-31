"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactions_controller_1 = require("../controllers/transactions.controller");
const router = (0, express_1.Router)();
const transactionsController = new transactions_controller_1.TransactionsController();
console.log('=== Setting up Transactions Routes ===');
// Public routes
router.get('/', (req, res) => {
    console.log('GET /api/admin/transactions route hit');
    transactionsController.getTransactions(req, res);
});
router.get('/:id', (req, res) => {
    console.log('GET /api/admin/transactions/:id route hit');
    transactionsController.getTransactionById(req, res);
});
router.patch('/:id/status', (req, res) => {
    console.log('PATCH /api/admin/transactions/:id/status route hit');
    transactionsController.updateTransactionStatus(req, res);
});
console.log('Transactions routes setup complete');
console.log('=====================');
exports.default = router;
