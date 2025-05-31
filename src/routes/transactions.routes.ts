import { Router } from 'express';
import { TransactionsController } from '../controllers/transactions.controller';

const router = Router();
const transactionsController = new TransactionsController();

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

export default router; 