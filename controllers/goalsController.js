import Goal from '../models/Goal.js';
import { updateCurrentWeekSnapshots } from '../utils/snapshotScheduler.js';

// @desc    Get all goals for the authenticated user
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const { completed, timeRange } = req.query;
    
    let query = { user: req.user._id };
    
    // Filter by completion status if provided
    if (completed !== undefined) {
      query.completed = completed === 'true';
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
        query.$or = [
          { createdAt: { $gte: startDate } },
          { completedAt: { $gte: startDate } }
        ];
      }
    }

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching goals',
    });
  }
};

// @desc    Get a single goal by ID
// @route   GET /api/goals/:id
// @access  Private
export const getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error('Get goal by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching goal',
    });
  }
};

// @desc    Create a new goal
// @route   POST /api/goals
// @access  Private
export const createGoal = async (req, res) => {
  try {
    const { title, tasks, targetDate } = req.body;

    // Validate input
    if (!title || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title and at least one task',
      });
    }

    // Filter out empty tasks
    const validTasks = tasks.filter(task => task.title && task.title.trim());
    
    if (validTasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one valid task',
      });
    }

    // Check if all tasks are completed
    const allTasksCompleted = validTasks.every(task => task.completed === true);

    // Create goal
    const goal = await Goal.create({
      user: req.user._id,
      title: title.trim(),
      tasks: validTasks,
      targetDate: targetDate || null,
      completed: allTasksCompleted,
      completedAt: allTasksCompleted ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal,
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating goal',
    });
  }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = async (req, res) => {
  try {
    const { title, tasks, targetDate } = req.body;

    // Find the goal
    let goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    // Update fields
    if (title !== undefined) {
      goal.title = title.trim();
    }

    if (tasks !== undefined) {
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one task',
        });
      }

      // Filter out empty tasks
      const validTasks = tasks.filter(task => task.title && task.title.trim());
      
      if (validTasks.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide at least one valid task',
        });
      }

      goal.tasks = validTasks;

      // Check if all tasks are now completed
      const allTasksCompleted = validTasks.every(task => task.completed === true);
      const wasCompleted = goal.completed;

      goal.completed = allTasksCompleted;
      
      // Update completedAt timestamp
      if (allTasksCompleted && !wasCompleted) {
        goal.completedAt = new Date();
      } else if (!allTasksCompleted) {
        goal.completedAt = null;
      }
    }

    if (targetDate !== undefined) {
      goal.targetDate = targetDate || null;
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: goal,
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating goal',
    });
  }
};

// @desc    Toggle task completion status
// @route   PATCH /api/goals/:id/tasks/:taskId
// @access  Private
export const toggleTaskCompletion = async (req, res) => {
  try {
    const { id, taskId } = req.params;

    // Find the goal
    const goal = await Goal.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    // Find the task
    const task = goal.tasks.id(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Toggle completion
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;

    // Check if all tasks are completed
    const allTasksCompleted = goal.tasks.every(t => t.completed);
    const wasCompleted = goal.completed;

    goal.completed = allTasksCompleted;

    // Update goal completedAt timestamp
    if (allTasksCompleted && !wasCompleted) {
      goal.completedAt = new Date();
    } else if (!allTasksCompleted) {
      goal.completedAt = null;
    }

    await goal.save();

    // Update snapshots for current week
    updateCurrentWeekSnapshots(req.user._id).catch(err => 
      console.error('Failed to update snapshots:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: goal,
    });
  } catch (error) {
    console.error('Toggle task completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating task',
    });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
      data: goal,
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting goal',
    });
  }
};

// @desc    Get goals statistics
// @route   GET /api/goals/stats
// @access  Private
export const getGoalsStats = async (req, res) => {
  try {
    const { timeRange } = req.query;
    
    let dateFilter = {};
    
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
        dateFilter = {
          $or: [
            { createdAt: { $gte: startDate } },
            { completedAt: { $gte: startDate } }
          ]
        };
      }
    }

    const goals = await Goal.find({ 
      user: req.user._id,
      ...dateFilter
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.completed).length;
    const activeGoals = totalGoals - completedGoals;

    const totalTasks = goals.reduce((sum, g) => sum + g.tasks.length, 0);
    const completedTasks = goals.reduce((sum, g) => 
      sum + g.tasks.filter(t => t.completed).length, 0
    );

    res.status(200).json({
      success: true,
      data: {
        totalGoals,
        completedGoals,
        activeGoals,
        totalTasks,
        completedTasks,
        completionRate: totalGoals > 0 ? (completedGoals / totalGoals * 100).toFixed(1) : 0,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Get goals stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching statistics',
    });
  }
};
