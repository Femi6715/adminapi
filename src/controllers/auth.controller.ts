import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  main_balance: number;
  bonus: number;
  is_banned: boolean;
  created_at: Date;
}

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, password, email, first_name, last_name, phone_number } = req.body;

      // Check if user already exists
      const [existingUsers] = await pool.query<User[]>(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      await pool.query(
        'INSERT INTO users (username, password, email, first_name, last_name, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, email, first_name, last_name, phone_number]
      );

      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error during registration' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      const [rows] = await pool.query<User[]>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      const user = rows[0];
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.is_banned) {
        return res.status(403).json({ message: 'Account is banned' });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          main_balance: user.main_balance,
          bonus: user.bonus
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  }
} 