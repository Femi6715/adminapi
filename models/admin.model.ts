import { RowDataPacket } from 'mysql2';

interface Admin extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  created_at: Date;
}

interface AdminLoginResponse {
  admin: Admin;
  token: string;
} 