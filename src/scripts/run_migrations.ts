import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/create_transfer_recipients_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await pool.query(migrationSQL);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    process.exit();
  }
}

runMigrations(); 