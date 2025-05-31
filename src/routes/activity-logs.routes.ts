import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const adminController = new AdminController();

// Get all activity logs with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await adminController.getActivityLogs(page, limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get activity logs by date range
router.get('/range', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const logs = await adminController.getActivityLogsByDateRange(
      start_date as string,
      end_date as string,
      page,
      limit
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs by date range:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Get activity logs by admin
router.get('/admin/:adminId', authMiddleware, async (req, res) => {
  try {
    const { adminId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const logs = await adminController.getActivityLogsByAdmin(
      parseInt(adminId),
      page,
      limit
    );
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs by admin:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

// Search activity logs
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const logs = await adminController.searchActivityLogs(
      query as string,
      page,
      limit
    );
    res.json(logs);
  } catch (error) {
    console.error('Error searching activity logs:', error);
    res.status(500).json({ error: 'Failed to search activity logs' });
  }
});

// Log a new activity
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { action, details } = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const ipAddress = req.ip || 'unknown';

    if (!action || !details) {
      return res.status(400).json({ error: 'Action and details are required' });
    }

    await adminController.logActivity(adminId, action, details, ipAddress);
    res.status(201).json({ message: 'Activity logged successfully' });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

export default router; 