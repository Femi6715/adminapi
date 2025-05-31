import { pool } from '../config/database';

export interface Transaction {
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

export class TransactionsModel {
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      console.log('Executing getAllTransactions query');
      const [rows] = await pool.query('SELECT * FROM transactions ORDER BY createdAt DESC');
      console.log('Query result:', rows);
      return rows as Transaction[];
    } catch (error) {
      console.error('Error in getAllTransactions:', error);
      throw error;
    }
  }

  async getTransactionById(id: number): Promise<Transaction | null> {
    try {
      console.log('Executing getTransactionById query for:', id);
      const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
      const transactions = rows as Transaction[];
      console.log('Query result:', transactions);
      return transactions.length > 0 ? transactions[0] : null;
    } catch (error) {
      console.error('Error in getTransactionById:', error);
      throw error;
    }
  }

  async updateTransactionStatus(id: number, status: 'pending' | 'completed' | 'failed'): Promise<boolean> {
    try {
      console.log('Executing updateTransactionStatus query for:', id, 'status:', status);
      const [result] = await pool.query(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, id]
      );
      console.log('Update result:', result);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error in updateTransactionStatus:', error);
      throw error;
    }
  }
} 