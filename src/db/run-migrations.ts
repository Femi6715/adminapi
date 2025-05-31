import { pool } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'activity_logs.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    // Execute each statement
    for (const statement of statements) {
      await pool.query(statement);
      console.log('Executed:', statement);
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migrations
runMigrations().catch(console.error); 