import Transaction from '../models/Transaction.js';

// @desc    Get all transactions for the authenticated user
// @route   GET /api/budget
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { type, timeRange } = req.query;
    
    let query = { user: req.user._id };
    
    // Filter by type if provided
    if (type && (type === 'income' || type === 'expense')) {
      query.type = type;
    }

    // Filter by time range if provided
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'annually':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query.date = { $gte: startDate };
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/budget/:id
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check if transaction belongs to the user
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this transaction',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message,
    });
  }
};

// @desc    Create new transaction
// @route   POST /api/budget
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const { item, amount, category, date, type } = req.body;

    // Validation
    if (!item || !amount || !category || !date || !type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({
        success: false,
        message: 'Type must be either income or expense',
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      item,
      amount: parseFloat(amount),
      category,
      date: new Date(date),
      type,
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message,
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/budget/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check if transaction belongs to the user
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this transaction',
      });
    }

    const { item, amount, category, date, type } = req.body;

    // Update fields
    if (item !== undefined) transaction.item = item;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (category !== undefined) transaction.category = category;
    if (date !== undefined) transaction.date = new Date(date);
    if (type !== undefined) {
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({
          success: false,
          message: 'Type must be either income or expense',
        });
      }
      transaction.type = type;
    }

    await transaction.save();

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message,
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/budget/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Check if transaction belongs to the user
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this transaction',
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error.message,
    });
  }
};

// @desc    Get budget statistics
// @route   GET /api/budget/stats
// @access  Private
export const getBudgetStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    let query = { user: req.user._id };
    
    // Filter by time range if provided
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'annually':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        query.date = { $gte: startDate };
      }
    }

    const transactions = await Transaction.find(query);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('Get budget stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget statistics',
      error: error.message,
    });
  }
};
