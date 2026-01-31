import express from 'express';
import { getDashboardStats, getWeeklyData, getDayActivities, createDailySnapshot, getHistory } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.get('/stats', protect, getDashboardStats);
router.get('/weekly', protect, getWeeklyData);
router.get('/day/:date', protect, getDayActivities);
router.post('/snapshot', protect, createDailySnapshot);
router.get('/history', protect, getHistory);

export default router;
