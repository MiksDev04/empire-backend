import express from 'express';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  toggleTaskCompletion,
  deleteGoal,
  getGoalsStats,
} from '../controllers/goalsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Get statistics (must be before /:id route)
router.get('/stats', getGoalsStats);

// Goals CRUD
router.route('/')
  .get(getGoals)      // GET /api/goals - Get all goals
  .post(createGoal);  // POST /api/goals - Create new goal

router.route('/:id')
  .get(getGoalById)   // GET /api/goals/:id - Get single goal
  .put(updateGoal)    // PUT /api/goals/:id - Update goal
  .delete(deleteGoal); // DELETE /api/goals/:id - Delete goal

// Toggle task completion
router.patch('/:id/tasks/:taskId', toggleTaskCompletion); // PATCH /api/goals/:id/tasks/:taskId

export default router;
