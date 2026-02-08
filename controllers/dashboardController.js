import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Workout from '../models/Workout.js';
import Journal from '../models/Journal.js';
import DailySnapshot from '../models/DailySnapshot.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📊 Dashboard Stats Request:', {
      userId,
      userIdType: typeof userId,
      user: {
        id: req.user._id,
        username: req.user.username
      }
    });
    
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
    
    console.log('📋 ALL Transactions fetched:', {
      userId,
      totalCount: allTransactions.length,
      transactions: allTransactions.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        item: t.item,
        date: t.date
      }))
    });
    
    // Calculate total balance (all time)
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpenses;
    
    console.log('💵 Balance Breakdown:', {
      incomeTransactions: allTransactions.filter(t => t.type === 'income').length,
      expenseTransactions: allTransactions.filter(t => t.type === 'expense').length,
      totalIncome,
      totalExpenses,
      totalBalance
    });
    
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
    let totalWorkoutDays = 0;
    
    if (currentWeekWorkout) {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      daysOfWeek.forEach(dayName => {
        const day = currentWeekWorkout.days[dayName];
        if (day && day.exercises && day.exercises.length > 0) {
          totalWorkoutDays++; // Count days that have exercises
          const allCompleted = day.exercises.every(ex => ex.completed);
          if (allCompleted) {
            workoutsCompleted++;
          }
        }
      });
    }
    
    // If no workout days, set to 1 to avoid division by zero display issues
    if (totalWorkoutDays === 0) {
      totalWorkoutDays = 1;
    }
    
    // --- GOALS COMPLETED THIS WEEK ---
    // Count active goals at the start of the week (not completed before this week)
    const totalGoalsThisWeek = await Goal.countDocuments({ 
      user: userId,
      $or: [
        { completed: false }, // Still not completed
        { completedAt: { $gte: startOfWeek } } // Or completed during/after this week
      ]
    });
    
    const goalsCompletedThisWeek = await Goal.countDocuments({
      user: userId,
      completed: true,
      completedAt: { $gte: startOfWeek, $lte: endOfWeek },
    });
    
    const result = {
      savings: Math.round(totalBalance),
      savingsChange: Math.round(savingsChange),
      workoutsCompleted,
      totalWorkoutDays,
      goalsCompleted: goalsCompletedThisWeek,
      totalGoals: totalGoalsThisWeek,
    };
    
    console.log('📊 Dashboard Stats Calculated:', {
      totalIncome,
      totalExpenses,
      totalBalance: Math.round(totalBalance),
      lastWeekBalance: Math.round(lastWeekBalance),
      savingsChange: Math.round(savingsChange),
      workoutsCompleted,
      totalWorkoutDays,
      goalsCompletedThisWeek,
      totalGoalsThisWeek,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get weekly data for charts (uses stored snapshots)
export const getWeeklyData = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Get start of current week
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Try to get snapshots from database first
    const snapshots = await DailySnapshot.find({
      user: userId,
      date: { $gte: startOfWeek, $lte: endOfWeek },
    }).sort({ date: 1 });
    
    const weeklyData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get current week workout for fallback
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
      
      // Check if we have a snapshot for this day
      const snapshot = snapshots.find(s => 
        s.date.toDateString() === dayStart.toDateString()
      );
      
      if (snapshot) {
        // Use stored snapshot data
        weeklyData.push({
          day: daysOfWeek[i],
          workouts: snapshot.workoutCompleted ? 1 : 0,
          goals: snapshot.goalsCompleted,
          savings: snapshot.savings,
          totalBalance: snapshot.totalBalance || 0,
        });
      } else {
        // Fallback: Calculate on-the-fly (for today or missing data)
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
        
        // Calculate total balance up to this day
        const allTransactionsUpToDate = await Transaction.find({
          user: userId,
          date: { $lte: dayEnd },
        });
        
        const totalIncome = allTransactionsUpToDate
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = allTransactionsUpToDate
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalBalance = totalIncome - totalExpenses;
        
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
          totalBalance: Math.round(totalBalance),
        });
      }
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
    const userId = req.user._id;
    const { date } = req.params;
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Get goals that were completed on this day OR have target date on this day
    const completedGoals = await Goal.find({
      user: userId,
      completed: true,
      completedAt: { $gte: dayStart, $lte: dayEnd },
    }).select('title completed createdAt targetDate completedAt');
    
    const targetGoals = await Goal.find({
      user: userId,
      targetDate: { $gte: dayStart, $lte: dayEnd },
    }).select('title completed createdAt targetDate completedAt');
    
    // Merge and deduplicate goals
    const goalsMap = new Map();
    [...completedGoals, ...targetGoals].forEach(goal => {
      goalsMap.set(goal._id.toString(), {
        title: goal.title,
        status: goal.completed ? 'completed' : 'pending',
        dateCreated: goal.createdAt,
        targetDate: goal.targetDate,
        dateCompleted: goal.completedAt,
      });
    });
    
    const goals = Array.from(goalsMap.values());
    
    // Get transactions with full details
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: dayStart, $lte: dayEnd },
    }).select('description type amount category date');
    
    const budget = transactions.map(t => ({
      description: t.description || t.category,
      type: t.type,
      amount: t.type === 'income' ? t.amount : -t.amount,
      category: t.category,
    }));
    
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
      if (dayData && dayData.exercises && dayData.exercises.length > 0) {
        workouts = dayData.exercises.map(ex => ({
          title: ex.name,
          completed: ex.completed || false,
          time: `${ex.sets} sets × ${ex.reps} ${ex.repsUnit || 'reps'}`,
        }));
      }
    }
    
    // Get journals
    const journals = await Journal.find({
      user: userId,
      createdAt: { $gte: dayStart, $lte: dayEnd },
    }).select('title content createdAt');
    
    const formattedJournals = journals.map(j => ({
      title: j.title,
      time: new Date(j.createdAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    }));
    
    res.json({
      success: true,
      data: {
        goals,
        workouts,
        budget,
        journals: formattedJournals,
      },
    });
  } catch (error) {
    console.error('Error fetching day activities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create daily snapshot
export const createDailySnapshot = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();
    
    // Set to start of day
    targetDate.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Get all data for this day
    const [transactions, goals, allGoals, weekWorkout, journals] = await Promise.all([
      Transaction.find({
        user: userId,
        date: { $gte: targetDate, $lte: dayEnd },
      }),
      Goal.find({
        user: userId,
        completed: true,
        completedAt: { $gte: targetDate, $lte: dayEnd },
      }),
      Goal.countDocuments({ user: userId }),
      getWorkoutForDay(userId, targetDate),
      Journal.countDocuments({
        user: userId,
        createdAt: { $gte: targetDate, $lte: dayEnd },
      }),
    ]);
    
    // Calculate metrics
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savings = income - expenses;
    
    // Calculate total balance up to this date
    const allTransactionsUpToDate = await Transaction.find({
      user: userId,
      date: { $lte: dayEnd },
    });
    
    const totalIncome = allTransactionsUpToDate
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = allTransactionsUpToDate
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpenses;
    
    // Workout data
    let workoutCompleted = false;
    let workoutName = '';
    let exercisesCompleted = 0;
    let totalExercises = 0;
    
    if (weekWorkout) {
      const dayOfWeek = targetDate.getDay();
      const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayData = weekWorkout.days[fullDayNames[dayOfWeek]];
      
      if (dayData && dayData.exercises && dayData.exercises.length > 0) {
        workoutName = dayData.name;
        totalExercises = dayData.exercises.length;
        exercisesCompleted = dayData.exercises.filter(ex => ex.completed).length;
        workoutCompleted = exercisesCompleted === totalExercises;
      }
    }
    
    // Create or update snapshot
    const snapshot = await DailySnapshot.findOneAndUpdate(
      { user: userId, date: targetDate },
      {
        income,
        expenses,
        savings,
        totalBalance,
        goalsCompleted: goals.length,
        totalGoals: allGoals,
        workoutCompleted,
        workoutName,
        exercisesCompleted,
        totalExercises,
        journalsWritten: journals,
      },
      { upsert: true, new: true }
    );
    
    res.json({ 
      success: true, 
      message: 'Snapshot created successfully',
      data: snapshot,
    });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper function to get workout for a specific day
async function getWorkoutForDay(userId, date) {
  const dayOfWeek = date.getDay();
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekId = startOfWeek.toISOString().split('T')[0];
  return await Workout.findOne({
    userId,
    weekId,
    isTemplate: false,
  });
}

// Backfill snapshots for past days
export const backfillSnapshots = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.body; // Default to last 30 days
    
    const snapshots = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create snapshots for each day going back
    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get all data for this day
      const [transactions, goals, allGoals, weekWorkout, journals] = await Promise.all([
        Transaction.find({
          user: userId,
          date: { $gte: targetDate, $lte: dayEnd },
        }),
        Goal.find({
          user: userId,
          completed: true,
          completedAt: { $gte: targetDate, $lte: dayEnd },
        }),
        Goal.countDocuments({ user: userId }),
        getWorkoutForDay(userId, targetDate),
        Journal.countDocuments({
          user: userId,
          createdAt: { $gte: targetDate, $lte: dayEnd },
        }),
      ]);
      
      // Calculate metrics
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const savings = income - expenses;
      
      // Calculate total balance up to this date
      const allTransactionsUpToDate = await Transaction.find({
        user: userId,
        date: { $lte: dayEnd },
      });
      
      const totalIncome = allTransactionsUpToDate
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = allTransactionsUpToDate
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalBalance = totalIncome - totalExpenses;
      
      // Workout data
      let workoutCompleted = false;
      let workoutName = '';
      let exercisesCompleted = 0;
      let totalExercises = 0;
      
      if (weekWorkout) {
        const dayOfWeek = targetDate.getDay();
        const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayData = weekWorkout.days[fullDayNames[dayOfWeek]];
        
        if (dayData && dayData.exercises && dayData.exercises.length > 0) {
          workoutName = dayData.name;
          totalExercises = dayData.exercises.length;
          exercisesCompleted = dayData.exercises.filter(ex => ex.completed).length;
          workoutCompleted = exercisesCompleted === totalExercises;
        }
      }
      
      // Create or update snapshot
      const snapshot = await DailySnapshot.findOneAndUpdate(
        { user: userId, date: targetDate },
        {
          income,
          expenses,
          savings,
          totalBalance,
          goalsCompleted: goals.length,
          totalGoals: allGoals,
          workoutCompleted,
          workoutName,
          exercisesCompleted,
          totalExercises,
          journalsWritten: journals,
        },
        { upsert: true, new: true }
      );
      
      snapshots.push(snapshot);
    }
    
    res.json({ 
      success: true, 
      message: `Created ${snapshots.length} snapshots`,
      data: { count: snapshots.length },
    });
  } catch (error) {
    console.error('Error backfilling snapshots:', error);
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
