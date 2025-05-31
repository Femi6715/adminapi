import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const adminController = new AdminController();

// Get all transfer recipients with pagination
router.get('/recipients', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const recipients = await adminController.getTransferRecipients(page, limit);
    res.json(recipients);
  } catch (error) {
    console.error('Error fetching transfer recipients:', error);
    res.status(500).json({ error: 'Failed to fetch transfer recipients' });
  }
});

// Get transfer recipients by date range
router.get('/recipients/range', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const recipients = await adminController.getTransferRecipientsByDateRange(
      start_date as string,
      end_date as string,
      page,
      limit
    );
    res.json(recipients);
  } catch (error) {
    console.error('Error fetching transfer recipients by date range:', error);
    res.status(500).json({ error: 'Failed to fetch transfer recipients' });
  }
});

// Get transfer recipients by user
router.get('/recipients/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const recipients = await adminController.getTransferRecipientsByUser(
      parseInt(userId),
      page,
      limit
    );
    res.json(recipients);
  } catch (error) {
    console.error('Error fetching transfer recipients by user:', error);
    res.status(500).json({ error: 'Failed to fetch transfer recipients' });
  }
});

// Search transfer recipients
router.get('/recipients/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const recipients = await adminController.searchTransferRecipients(
      query as string,
      page,
      limit
    );
    res.json(recipients);
  } catch (error) {
    console.error('Error searching transfer recipients:', error);
    res.status(500).json({ error: 'Failed to search transfer recipients' });
  }
});

export default router; 