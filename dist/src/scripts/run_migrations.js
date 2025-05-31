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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function runMigrations() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Read the migration file
            const migrationPath = path_1.default.join(__dirname, '../migrations/create_transfer_recipients_table.sql');
            const migrationSQL = fs_1.default.readFileSync(migrationPath, 'utf8');
            // Execute the migration
            yield database_1.pool.query(migrationSQL);
            console.log('Migration completed successfully');
        }
        catch (error) {
            console.error('Error running migration:', error);
        }
        finally {
            process.exit();
        }
    });
}
runMigrations();
