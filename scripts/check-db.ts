import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

interface CountResult extends RowDataPacket {
  count: number;
}

const pool = mysql.createPool({
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

async function checkTables() {
  try {
    // Check if tables exist
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in database:', tables);

    // Check structure of tickets table
    const [ticketsStructure] = await pool.query('DESCRIBE tickets');
    console.log('Tickets table structure:', ticketsStructure);

    // Check structure of transactions table
    const [transactionsStructure] = await pool.query('DESCRIBE transactions');
    console.log('Transactions table structure:', transactionsStructure);

    // Check for data in tickets
    const [tickets] = await pool.query<CountResult[]>('SELECT COUNT(*) as count FROM tickets');
    console.log('Tickets count:', tickets[0]?.count);

    // Check for data in transactions
    const [transactions] = await pool.query<CountResult[]>('SELECT COUNT(*) as count FROM transactions');
    console.log('Transactions count:', transactions[0]?.count);

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
