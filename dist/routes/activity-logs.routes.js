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
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const adminController = new admin_controller_1.AdminController();
// Get all activity logs with pagination
router.get('/', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const logs = yield adminController.getActivityLogs(page, limit);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
}));
// Get activity logs by date range
router.get('/range', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start_date, end_date } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const logs = yield adminController.getActivityLogsByDateRange(start_date, end_date, page, limit);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching activity logs by date range:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
}));
// Get activity logs by admin
router.get('/admin/:adminId', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adminId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const logs = yield adminController.getActivityLogsByAdmin(parseInt(adminId), page, limit);
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching activity logs by admin:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
}));
// Search activity logs
router.get('/search', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const logs = yield adminController.searchActivityLogs(query, page, limit);
        res.json(logs);
    }
    catch (error) {
        console.error('Error searching activity logs:', error);
        res.status(500).json({ error: 'Failed to search activity logs' });
    }
}));
// Log a new activity
router.post('/', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { action, details } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const ipAddress = req.ip || 'unknown';
        if (!action || !details) {
            return res.status(400).json({ error: 'Action and details are required' });
        }
        yield adminController.logActivity(adminId, action, details, ipAddress);
        res.status(201).json({ message: 'Activity logged successfully' });
    }
    catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ error: 'Failed to log activity' });
    }
}));
exports.default = router;
