"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const environment_1 = require("../config/environment");
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const tickets_routes_1 = __importDefault(require("./routes/tickets.routes"));
const transactions_routes_1 = __importDefault(require("./routes/transactions.routes"));
const activity_logs_routes_1 = __importDefault(require("./routes/activity-logs.routes"));
const withdraws_routes_1 = __importDefault(require("./routes/withdraws.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const database_1 = require("../src/config/database");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Mount routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/tickets', tickets_routes_1.default);
app.use('/api/transactions', transactions_routes_1.default);
app.use('/api/activity-logs', activity_logs_routes_1.default);
app.use('/api/withdraws', withdraws_routes_1.default);
// Test database connection
database_1.pool.query('SELECT NOW()')
    .then(() => {
    console.log('Database connected successfully');
})
    .catch((err) => {
    console.error('Error connecting to the database:', err);
});
// Error handling middleware
app.use(error_middleware_1.errorHandler);
const PORT = environment_1.environment.port || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
