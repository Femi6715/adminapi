import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

interface User extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  is_banned: number;
  role: string;
}

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      // Get user from database
      const [users] = await pool.query<User[]>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = users[0];

      // Check if user is banned (MySQL returns 1 for true, 0 for false)
      if (user.is_banned === 1) {
        return res.status(403).json({ message: 'Your account has been banned. Please contact support.' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  }
}

export default new AuthController(); 