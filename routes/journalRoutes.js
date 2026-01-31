import express from 'express';
import {
  getJournalEntries,
  getJournalEntryById,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalStats,
} from '../controllers/journalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Get statistics (must be before /:id route)
router.get('/stats', getJournalStats);

// Journal CRUD
router.route('/')
  .get(getJournalEntries)       // GET /api/journal - Get all journal entries
  .post(createJournalEntry);    // POST /api/journal - Create new journal entry

router.route('/:id')
  .get(getJournalEntryById)     // GET /api/journal/:id - Get single journal entry
  .put(updateJournalEntry)      // PUT /api/journal/:id - Update journal entry
  .delete(deleteJournalEntry);  // DELETE /api/journal/:id - Delete journal entry

export default router;
