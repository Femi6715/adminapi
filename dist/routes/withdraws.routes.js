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
// Get all transfer recipients with pagination
router.get('/recipients', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const recipients = yield adminController.getTransferRecipients(page, limit);
        res.json(recipients);
    }
    catch (error) {
        console.error('Error fetching transfer recipients:', error);
        res.status(500).json({ error: 'Failed to fetch transfer recipients' });
    }
}));
// Get transfer recipients by date range
router.get('/recipients/range', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start_date, end_date } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        const recipients = yield adminController.getTransferRecipientsByDateRange(start_date, end_date, page, limit);
        res.json(recipients);
    }
    catch (error) {
        console.error('Error fetching transfer recipients by date range:', error);
        res.status(500).json({ error: 'Failed to fetch transfer recipients' });
    }
}));
// Get transfer recipients by user
router.get('/recipients/user/:userId', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const recipients = yield adminController.getTransferRecipientsByUser(parseInt(userId), page, limit);
        res.json(recipients);
    }
    catch (error) {
        console.error('Error fetching transfer recipients by user:', error);
        res.status(500).json({ error: 'Failed to fetch transfer recipients' });
    }
}));
// Search transfer recipients
router.get('/recipients/search', auth_middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const recipients = yield adminController.searchTransferRecipients(query, page, limit);
        res.json(recipients);
    }
    catch (error) {
        console.error('Error searching transfer recipients:', error);
        res.status(500).json({ error: 'Failed to search transfer recipients' });
    }
}));
exports.default = router;
