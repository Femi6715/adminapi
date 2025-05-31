export interface Admin {
  id: number;
  username: string;
  email: string;
  password: string; // Added for backend password check
  role: 'super_admin' | 'admin';
  created_at: string;
}

export interface AdminLoginResponse {
  admin: Omit<Admin, 'password'>;
  token: string;
} 