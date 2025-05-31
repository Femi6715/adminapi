-- Add is_banned column to users table
ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;

-- Update existing users to have is_banned = FALSE
UPDATE users SET is_banned = FALSE WHERE is_banned IS NULL; 