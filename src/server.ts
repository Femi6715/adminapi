import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { environment } from './config/environment';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import ticketRoutes from './routes/tickets.routes';
import transactionRoutes from './routes/transactions.routes';
import activityLogsRoutes from './routes/activity-logs.routes';
import withdrawsRoutes from './routes/withdraws.routes';
import { errorHandler } from './middleware/error.middleware';
import { pool } from './config/database';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/withdraws', withdrawsRoutes);

// Test database connection
pool.query('SELECT NOW()')
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });

// Error handling middleware
app.use(errorHandler);

const PORT = environment.port || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 