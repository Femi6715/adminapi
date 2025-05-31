import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

interface Transaction extends RowDataPacket {
  id: number;
  user_id: number;
  amount: number;
  amount_involved: number;
  acct_balance: number;
  time_stamp: number;
  trans_date: string;
  transaction_type: 'deposit' | 'withdrawal' | 'winning' | 'ticket_purchase';
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionsController {
  async getTransactions(req: Request, res: Response) {
    try {
      console.log('Attempting to fetch transactions...');
      const [rows] = await pool.query<Transaction[]>(
        'SELECT * FROM transactions ORDER BY updatedAt DESC'
      );
      console.log('Successfully fetched transactions:', rows.length);
      res.json({ transactions: rows });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('Table')) {
          res.status(404).json({ message: 'Transactions table not found in database' });
        } else {
          res.status(500).json({ message: 'Error fetching transactions', details: error.message });
        }
      } else {
        res.status(500).json({ message: 'Unknown error fetching transactions' });
      }
    }
  }

  async getTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('Attempting to fetch transaction with ID:', id);
      const [rows] = await pool.query<Transaction[]>(
        'SELECT * FROM transactions WHERE id = ?',
        [id]
      );
      if (rows.length === 0) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
      }
      console.log('Successfully fetched transaction');
      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('Table')) {
          res.status(404).json({ message: 'Transactions table not found in database' });
        } else {
          res.status(500).json({ message: 'Error fetching transaction', details: error.message });
        }
      } else {
        res.status(500).json({ message: 'Unknown error fetching transaction' });
      }
    }
  }
}
