import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Workout from '../models/Workout.js';
import Journal from '../models/Journal.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Get start and end of current week (Sunday to Saturday)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Get previous week dates for comparison
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);
    
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setSeconds(endOfLastWeek.getSeconds() - 1);
    
    // --- TOTAL SAVINGS (Balance from ALL transactions like Budget page) ---
    // Get ALL transactions to calculate total balance
    const allTransactions = await Transaction.find({ user: userId });
    
    // Calculate total balance (all time)
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpenses;
    
    // For comparison, get last week's balance
    const lastWeekTransactions = await Transaction.find({
      user: userId,
      date: { $lte: endOfLastWeek },
    });
    
    const lastWeekIncome = lastWeekTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastWeekExpenses = lastWeekTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastWeekBalance = lastWeekIncome - lastWeekExpenses;
    
    // Calculate percentage change
    let savingsChange = 0;
    if (lastWeekBalance !== 0) {
      savingsChange = ((totalBalance - lastWeekBalance) / Math.abs(lastWeekBalance)) * 100;
    } else if (totalBalance > 0) {
      savingsChange = 100;
    } else if (totalBalance < 0) {
      savingsChange = -100;
    }
    
    // --- WORKOUTS THIS WEEK ---
    const weekId = startOfWeek.toISOString().split('T')[0];
    const currentWeekWorkout = await Workout.findOne({
      userId,
      weekId,
      isTemplate: false,
    });
    
    let workoutsCompleted = 0;
    let totalWorkoutDays = 7;
    
    if (currentWeekWorkout) {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      daysOfWeek.forEach(dayName => {
        const day = currentWeekWorkout.days[dayName];
        if (day && day.exercises && day.exercises.length > 0) {
          const allCompleted = day.exercises.every(ex => ex.completed);
          if (allCompleted) {
            workoutsCompleted++;
          }
        }
      });
    }
    
    // --- GOALS COMPLETED ---
    const totalGoals = await Goal.countDocuments({ user: userId });
    const goalsCompleted = await Goal.countDocuments({
      user: userId,
      completed: true,
    });
    
    const result = {
      savings: Math.round(totalBalance),
      savingsChange: Math.round(savingsChange),
      workoutsCompleted,
      totalWorkoutDays,
      goalsCompleted,
      totalGoals,
    };
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get weekly data for charts
export const getWeeklyData = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Get start of current week
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get current week workout
    const weekId = startOfWeek.toISOString().split('T')[0];
    const currentWeekWorkout = await Workout.findOne({
      userId,
      weekId,
      isTemplate: false,
    });
    
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get transactions for this day
      const dayTransactions = await Transaction.find({
        user: userId,
        date: { $gte: dayStart, $lte: dayEnd },
      });
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayExpenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const daySavings = dayIncome - dayExpenses;
      
      // Get goals completed on this day
      const goalsCompletedToday = await Goal.countDocuments({
        user: userId,
        completed: true,
        completedAt: { $gte: dayStart, $lte: dayEnd },
      });
      
      // Get workouts completed on this day
      let workoutsCompleted = 0;
      if (currentWeekWorkout) {
        const dayData = currentWeekWorkout.days[fullDayNames[i]];
        if (dayData && dayData.exercises && dayData.exercises.length > 0) {
          const allCompleted = dayData.exercises.every(ex => ex.completed);
          if (allCompleted) {
            workoutsCompleted = 1;
          }
        }
      }
      
      weeklyData.push({
        day: daysOfWeek[i],
        workouts: workoutsCompleted,
        goals: goalsCompletedToday,
        savings: Math.round(daySavings),
      });
    }
    
    res.json({
      success: true,
      data: weeklyData,
    });
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get activities for a specific day
export const getDayActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Get goals completed on this day
    const goals = await Goal.find({
      user: userId,
      completedAt: { $gte: dayStart, $lte: dayEnd },
    }).select('title completed');
    
    // Get transactions
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd },
    });
    
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Get workouts for this day
    const dayOfWeek = dayStart.getDay();
    const startOfWeek = new Date(dayStart);
    startOfWeek.setDate(dayStart.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekId = startOfWeek.toISOString().split('T')[0];
    const weekWorkout = await Workout.findOne({
      userId,
      weekId,
      isTemplate: false,
    });
    
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let workouts = [];
    
    if (weekWorkout) {
      const dayData = weekWorkout.days[fullDayNames[dayOfWeek]];
      if (dayData && dayData.exercises) {
        workouts = [{
          title: dayData.name,
          exercises: dayData.exercises.map(ex => ex.name),
        }];
      }
    }
    
    // Get journals
    const journals = await Journal.find({
      user: userId,
      createdAt: { $gte: dayStart, $lte: dayEnd },
    }).select('title content');
    
    res.json({
      success: true,
      data: {
        goals,
        workouts,
        budget: { income, expenses },
        journals,
      },
    });
  } catch (error) {
    console.error('Error fetching day activities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create daily snapshot (placeholder for future feature)
export const createDailySnapshot = async (req, res) => {
  try {
    res.json({ success: true, message: 'Snapshot feature coming soon' });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get history (placeholder for future feature)
export const getHistory = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
