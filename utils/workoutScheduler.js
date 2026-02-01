import cron from 'node-cron';
import Workout from '../models/Workout.js';
import User from '../models/User.js';

// Get the week ID for a given date (Sunday start of week)
const getWeekId = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const startOfWeek = new Date(start);
  startOfWeek.setDate(start.getDate() - dayOfWeek);
  return startOfWeek.toISOString().split('T')[0];
};

// Archive the current week's workout for a specific user
export const archiveUserWeek = async (userId, weekId) => {
  try {
    const workout = await Workout.findOne({
      userId: userId,
      weekId: weekId,
      isTemplate: false,
      archivedAt: { $exists: false }, // Only archive if not already archived
    });

    if (workout) {
      const startDate = new Date(workout.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      workout.endDate = endDate;
      workout.archivedAt = new Date();
      await workout.save();

      console.log(`✓ Archived week ${weekId} for user ${userId}`);
      return workout;
    }

    return null;
  } catch (error) {
    console.error(`Error archiving week for user ${userId}:`, error);
    return null;
  }
};

// Archive current week for all users
export const archiveAllUsersCurrentWeek = async () => {
  try {
    console.log('Starting weekly workout archival...');
    
    // Get yesterday's date (Saturday) to determine the week that just ended
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const weekId = getWeekId(yesterday);
    
    console.log(`Archiving workouts for week: ${weekId}`);
    
    const users = await User.find({});
    let archivedCount = 0;
    
    for (const user of users) {
      const result = await archiveUserWeek(user._id, weekId);
      if (result) {
        archivedCount++;
      }
    }
    
    console.log(`✓ Archived ${archivedCount} workout weeks for ${users.length} users`);
  } catch (error) {
    console.error('Error during weekly workout archival:', error);
  }
};

// Initialize the cron job - runs every Sunday at 00:00 (midnight)
export const initWorkoutScheduler = () => {
  // Run every Sunday at midnight
  cron.schedule('0 0 * * 0', async () => {
    console.log(`[${new Date().toISOString()}] Running automatic weekly workout archival...`);
    await archiveAllUsersCurrentWeek();
  });

  console.log('✓ Workout scheduler initialized - will run every Sunday at midnight');
};

// Manual trigger function for testing
export const triggerManualArchival = async () => {
  console.log('Manual workout archival triggered');
  await archiveAllUsersCurrentWeek();
};
