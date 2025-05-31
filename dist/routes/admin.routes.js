"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const tickets_routes_1 = __importDefault(require("./tickets.routes"));
const transactions_routes_1 = __importDefault(require("./transactions.routes"));
const router = (0, express_1.Router)();
const adminController = new admin_controller_1.AdminController();
// Public routes
router.post('/login', adminController.login.bind(adminController));
// Protected routes
router.get('/profile', auth_middleware_1.authMiddleware, adminController.getProfile.bind(adminController));
router.get('/stats', auth_middleware_1.authMiddleware, adminController.getStats.bind(adminController));
router.get('/users', auth_middleware_1.authMiddleware, adminController.getUsers.bind(adminController));
router.delete('/users/:username', auth_middleware_1.authMiddleware, adminController.deleteUser.bind(adminController));
router.put('/users/:username/ban', auth_middleware_1.authMiddleware, adminController.banUser.bind(adminController));
router.put('/users/:username/unban', auth_middleware_1.authMiddleware, adminController.unbanUser.bind(adminController));
// Mount tickets routes
console.log('Mounting tickets routes at /api/admin/tickets');
router.use('/tickets', auth_middleware_1.authMiddleware, (req, res, next) => {
    console.log('Tickets route hit:', req.method, req.originalUrl);
    next();
}, tickets_routes_1.default);
// Mount transactions routes
console.log('Mounting transactions routes at /api/admin/transactions');
router.use('/transactions', auth_middleware_1.authMiddleware, transactions_routes_1.default);
exports.default = router;
