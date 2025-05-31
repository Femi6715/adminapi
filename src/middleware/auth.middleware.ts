import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { environment } from '../../config/environment';

interface UserPayload extends JwtPayload {
  id: number;
  username: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth middleware - Request received');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('No authorization header');
      return res.status(401).json({ message: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, environment.jwt.secret) as UserPayload;
    console.log('Token decoded:', decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}; 