-- Check if is_banned column exists
SET @dbname = 'Padilotto_wordrushof';
SET @tablename = 'users';
SET @columnname = 'is_banned';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE 
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  "SELECT 'Column already exists'",
  "ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists; 