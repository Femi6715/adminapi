"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const adminController = new admin_controller_1.AdminController();
// Public routes
router.post('/login', adminController.login);
// Protected routes
router.get('/me', auth_middleware_1.authMiddleware, adminController.getProfile);
exports.default = router;
