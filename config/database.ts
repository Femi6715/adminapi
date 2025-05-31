import mysql from 'mysql2/promise';
import { environment } from '../config/environment';

// Create the connection pool
export const pool = mysql.createPool({
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

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  }); 