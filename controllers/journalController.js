import Journal from '../models/Journal.js';

// @desc    Get all journal entries for the authenticated user
// @route   GET /api/journal
// @access  Private
export const getJournalEntries = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = { user: req.user._id };
    
    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const entries = await Journal.find(query).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal entries',
      error: error.message,
    });
  }
};

// @desc    Get single journal entry by ID
// @route   GET /api/journal/:id
// @access  Private
export const getJournalEntryById = async (req, res) => {
  try {
    const entry = await Journal.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found',
      });
    }

    // Check if entry belongs to the user
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this journal entry',
      });
    }

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal entry',
      error: error.message,
    });
  }
};

// @desc    Create new journal entry
// @route   POST /api/journal
// @access  Private
export const createJournalEntry = async (req, res) => {
  try {
    const { title, content, date } = req.body;

    // Validation
    if (!title || !content || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, content, and date',
      });
    }

    const entry = await Journal.create({
      user: req.user._id,
      title,
      content,
      date: new Date(date),
    });

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create journal entry',
      error: error.message,
    });
  }
};

// @desc    Update journal entry
// @route   PUT /api/journal/:id
// @access  Private
export const updateJournalEntry = async (req, res) => {
  try {
    let entry = await Journal.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found',
      });
    }

    // Check if entry belongs to the user
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this journal entry',
      });
    }

    const { title, content, date } = req.body;

    // Update fields
    if (title !== undefined) entry.title = title;
    if (content !== undefined) entry.content = content;
    if (date !== undefined) entry.date = new Date(date);

    await entry.save();

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update journal entry',
      error: error.message,
    });
  }
};

// @desc    Delete journal entry
// @route   DELETE /api/journal/:id
// @access  Private
export const deleteJournalEntry = async (req, res) => {
  try {
    const entry = await Journal.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found',
      });
    }

    // Check if entry belongs to the user
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this journal entry',
      });
    }

    await entry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete journal entry',
      error: error.message,
    });
  }
};

// @desc    Get journal statistics
// @route   GET /api/journal/stats
// @access  Private
export const getJournalStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = { user: req.user._id };
    
    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const totalEntries = await Journal.countDocuments(query);
    
    // Get entry count by month for the current year
    const currentYear = year || new Date().getFullYear();
    const entriesByMonth = await Journal.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        entriesByMonth,
      },
    });
  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch journal statistics',
      error: error.message,
    });
  }
};
