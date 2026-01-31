import express from 'express';
import {
  getTrashItems,
  moveToTrash,
  restoreFromTrash,
  permanentlyDelete,
  emptyTrash,
} from '../controllers/trashController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Empty trash (must be before /:id route)
router.delete('/empty', emptyTrash);

// Trash CRUD
router.route('/')
  .get(getTrashItems)       // GET /api/trash - Get all trash items
  .post(moveToTrash);       // POST /api/trash - Move item to trash

router.post('/:id/restore', restoreFromTrash);  // POST /api/trash/:id/restore - Restore item
router.delete('/:id', permanentlyDelete);       // DELETE /api/trash/:id - Permanently delete item

export default router;
