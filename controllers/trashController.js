import Trash from '../models/Trash.js';
import Goal from '../models/Goal.js';
import Workout from '../models/Workout.js';
import Transaction from '../models/Transaction.js';
import Journal from '../models/Journal.js';

// @desc    Get all trash items for the authenticated user
// @route   GET /api/trash
// @access  Private
export const getTrashItems = async (req, res) => {
  try {
    const trashItems = await Trash.find({ user: req.user._id }).sort({ trashedAt: -1 });

    res.status(200).json({
      success: true,
      count: trashItems.length,
      data: trashItems,
    });
  } catch (error) {
    console.error('Get trash items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trash items',
      error: error.message,
    });
  }
};

// @desc    Move item to trash
// @route   POST /api/trash
// @access  Private
export const moveToTrash = async (req, res) => {
  try {
    const { type, originalId, data } = req.body;

    // Validation
    if (!type || !originalId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, originalId, and data',
      });
    }

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const trashItem = await Trash.create({
      user: req.user._id,
      type,
      originalId,
      data,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: trashItem,
    });
  } catch (error) {
    console.error('Move to trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move item to trash',
      error: error.message,
    });
  }
};

// @desc    Restore item from trash
// @route   POST /api/trash/:id/restore
// @access  Private
export const restoreFromTrash = async (req, res) => {
  try {
    const trashItem = await Trash.findById(req.params.id);

    if (!trashItem) {
      return res.status(404).json({
        success: false,
        message: 'Trash item not found',
      });
    }

    // Check if trash item belongs to the user
    if (trashItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to restore this item',
      });
    }

    // Restore to original collection based on type
    let restoredItem;
    switch (trashItem.type) {
      case 'goal':
        restoredItem = await Goal.create({
          ...trashItem.data,
          user: req.user._id,
        });
        break;
      case 'workout':
        restoredItem = await Workout.create({
          ...trashItem.data,
          user: req.user._id,
        });
        break;
      case 'budget':
        restoredItem = await Transaction.create({
          ...trashItem.data,
          user: req.user._id,
        });
        break;
      case 'journal':
        restoredItem = await Journal.create({
          ...trashItem.data,
          user: req.user._id,
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid item type',
        });
    }

    // Delete from trash
    await trashItem.deleteOne();

    res.status(200).json({
      success: true,
      data: restoredItem,
      message: 'Item restored successfully',
    });
  } catch (error) {
    console.error('Restore from trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore item',
      error: error.message,
    });
  }
};

// @desc    Permanently delete item from trash
// @route   DELETE /api/trash/:id
// @access  Private
export const permanentlyDelete = async (req, res) => {
  try {
    const trashItem = await Trash.findById(req.params.id);

    if (!trashItem) {
      return res.status(404).json({
        success: false,
        message: 'Trash item not found',
      });
    }

    // Check if trash item belongs to the user
    if (trashItem.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this item',
      });
    }

    await trashItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Item permanently deleted',
      data: {},
    });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message,
    });
  }
};

// @desc    Empty trash (delete all items)
// @route   DELETE /api/trash/empty
// @access  Private
export const emptyTrash = async (req, res) => {
  try {
    const result = await Trash.deleteMany({ user: req.user._id });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} items permanently deleted`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to empty trash',
      error: error.message,
    });
  }
};
