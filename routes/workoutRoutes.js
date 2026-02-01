import express from 'express';
import * as workoutController from '../controllers/workoutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// Template routes
router.get('/template', workoutController.getTemplate);
router.put('/template', workoutController.updateTemplate);

// Current week routes
router.get('/current', workoutController.getCurrentWeek);
router.put('/current', workoutController.updateCurrentWeek);

// Toggle exercise completion
router.patch('/:weekId/:day/:exerciseId/toggle', workoutController.toggleExercise);

// Archive week
router.post('/:weekId/archive', workoutController.archiveWeek);

// History
router.get('/history', workoutController.getHistory);

// Delete week
router.delete('/:weekId', workoutController.deleteWeek);

// Sync current week with template
router.post('/:weekId/sync', workoutController.syncWithTemplate);

// Manual trigger for weekly archival (for testing)
router.post('/archive-all', workoutController.manualArchiveWeeks);

// Generate sample workout history (for testing)
router.post('/sample-history', workoutController.generateSampleHistory);

export default router;
