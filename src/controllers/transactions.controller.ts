import { Request, Response } from 'express';
import { TransactionsModel } from '../models/transactions.model';

export class TransactionsController {
  private transactionsModel: TransactionsModel;

  constructor() {
    this.transactionsModel = new TransactionsModel();
    console.log('TransactionsController initialized');
  }

  getTransactions = async (req: Request, res: Response) => {
    console.log('\n=== getTransactions called ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    
    try {
      console.log('Calling transactionsModel.getAllTransactions()');
      const transactions = await this.transactionsModel.getAllTransactions();
      const transactionsArray = transactions as any[];
      console.log('Transactions retrieved successfully, count:', transactionsArray ? transactionsArray.length : 0);
      console.log('First transaction (if any):', transactionsArray && transactionsArray.length > 0 ? transactionsArray[0] : 'No transactions found');
      
      if (!transactionsArray || transactionsArray.length === 0) {
        console.log('No transactions found in database');
        return res.status(404).json({ error: 'No transactions found' });
      }
      
      res.json({ transactions: transactions });
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };

  getTransactionById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const transaction = await this.transactionsModel.getTransactionById(id);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      res.json({ transaction });
    } catch (error: any) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };

  updateTransactionStatus = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;

      if (!status || !['pending', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const success = await this.transactionsModel.updateTransactionStatus(id, status as 'pending' | 'completed' | 'failed');
      
      if (!success) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ message: 'Transaction status updated successfully' });
    } catch (error: any) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
} 