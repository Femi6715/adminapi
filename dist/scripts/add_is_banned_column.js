"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
function addIsBannedColumn() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if column exists
            const [columns] = yield database_1.pool.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_SCHEMA = 'Padilotto_wordrushof'
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'is_banned'
    `);
            const columnExists = columns[0].count > 0;
            if (!columnExists) {
                // Add the column
                yield database_1.pool.query(`
        ALTER TABLE users 
        ADD COLUMN is_banned BOOLEAN DEFAULT FALSE
      `);
                console.log('Added is_banned column to users table');
            }
            else {
                console.log('is_banned column already exists');
            }
            process.exit(0);
        }
        catch (error) {
            console.error('Error adding is_banned column:', error);
            process.exit(1);
        }
    });
}
addIsBannedColumn();
