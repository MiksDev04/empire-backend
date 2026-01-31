import express from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBudgetStats,
} from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Get statistics (must be before /:id route)
router.get('/stats', getBudgetStats);

// Transactions CRUD
router.route('/')
  .get(getTransactions)       // GET /api/budget - Get all transactions
  .post(createTransaction);   // POST /api/budget - Create new transaction

router.route('/:id')
  .get(getTransactionById)    // GET /api/budget/:id - Get single transaction
  .put(updateTransaction)     // PUT /api/budget/:id - Update transaction
  .delete(deleteTransaction); // DELETE /api/budget/:id - Delete transaction

export default router;
