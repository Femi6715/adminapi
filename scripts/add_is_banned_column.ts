import { pool } from '../config/database';

async function addIsBannedColumn() {
  try {
    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = 'Padilotto_wordrushof'
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'is_banned'
    `);

    const columnExists = (columns as any)[0].count > 0;

    if (!columnExists) {
      // Add the column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN is_banned BOOLEAN DEFAULT FALSE
      `);
      console.log('Added is_banned column to users table');
    } else {
      console.log('is_banned column already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error adding is_banned column:', error);
    process.exit(1);
  }
}

addIsBannedColumn(); 