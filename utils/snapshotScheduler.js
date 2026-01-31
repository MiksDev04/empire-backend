import cron from 'node-cron';
import DailySnapshot from '../models/DailySnapshot.js';
import Goal from '../models/Goal.js';
import Workout from '../models/Workout.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

// Calculate snapshot for a specific user and date
export const calculateSnapshot = async (userId, date) => {
  const snapshotDate = new Date(date);
  snapshotDate.setHours(0, 0, 0, 0);

  const dayStart = new Date(snapshotDate);
  const dayEnd = new Date(snapshotDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Calculate workouts completed
  const workouts = await Workout.find({
    userId: userId,
    startDate: { $lte: dayEnd },
    $or: [
      { endDate: { $gte: dayStart } },
      { endDate: null }
    ],
    isTemplate: false,
  });

  let workoutsCompleted = 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[snapshotDate.getDay()];
  
  workouts.forEach(workout => {
    const day = workout.days?.[dayOfWeek];
    if (day && day.exercises && day.exercises.length > 0) {
      const allCompleted = day.exercises.every(ex => ex.completed);
      if (allCompleted) {
        workoutsCompleted++;
      }
    }
  });

  // Calculate goals completed
  const goalsCompleted = await Goal.countDocuments({
    user: userId,
    completed: true,
    dateCompleted: { $gte: dayStart, $lte: dayEnd },
  });

  // Calculate savings
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: dayStart, $lte: dayEnd },
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = totalIncome - totalExpense;

  // Create or update snapshot
  const snapshot = await DailySnapshot.findOneAndUpdate(
    { user: userId, date: snapshotDate },
    {
      user: userId,
      date: snapshotDate,
      workoutsCompleted,
      goalsCompleted,
      savings,
      totalIncome,
      totalExpense,
    },
    { upsert: true, new: true }
  );

  return snapshot;
};

// Generate snapshots for all users for a specific date
export const generateDailySnapshots = async (date = new Date()) => {
  try {
    console.log(`Generating daily snapshots for ${date.toDateString()}...`);
    
    const users = await User.find({});
    
    for (const user of users) {
      await calculateSnapshot(user._id, date);
    }
    
    console.log(`✓ Snapshots generated for ${users.length} users`);
  } catch (error) {
    console.error('Error generating daily snapshots:', error);
  }
};

// Generate snapshots for the past 7 days including today for all users
export const generateWeekSnapshots = async () => {
  try {
    console.log('Generating snapshots for the past 7 days...');
    
    const now = new Date();
    const users = await User.find({});
    
    // Generate for the past 7 days including today
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      console.log(`Generating for ${date.toDateString()}...`);
      
      for (const user of users) {
        await calculateSnapshot(user._id, date);
      }
    }
    
    console.log(`✓ Week snapshots generated for ${users.length} users (7 days including today)`);
  } catch (error) {
    console.error('Error generating week snapshots:', error);
  }
};

// Schedule daily snapshot generation at midnight
export const scheduleDailySnapshots = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled daily snapshot generation...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await generateDailySnapshots(yesterday);
  });

  console.log('✓ Daily snapshot scheduler initialized (runs at midnight)');
};

// Also run at the end of each day (11:59 PM) to capture current day
export const scheduleEndOfDaySnapshots = () => {
  // Run every day at 11:59 PM
  cron.schedule('59 23 * * *', async () => {
    console.log('Running end-of-day snapshot generation...');
    await generateDailySnapshots(new Date());
  });

  console.log('✓ End-of-day snapshot scheduler initialized (runs at 11:59 PM)');
};
