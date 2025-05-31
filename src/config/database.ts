import mysql from 'mysql2/promise';
import { environment } from '../config/environment';

// Create the connection pool
export const pool = mysql.createPool({
  host: environment.database.host,
  port: environment.database.port,
  user: environment.database.user,
  password: environment.database.password,
  database: environment.database.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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