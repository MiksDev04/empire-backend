import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workout from './models/Workout.js';
import User from './models/User.js';

dotenv.config();

const seedWorkoutHistory = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get the first user (or create a test user)
    let user = await User.findOne();
    
    if (!user) {
      console.log('No users found in database. Please create a user first.');
      process.exit(0);
    }

    console.log(`Using user: ${user.email} (ID: ${user._id})`);

    // Create 3 weeks of sample history
    const sampleWeeks = [];
    
    for (let weeksAgo = 3; weeksAgo >= 1; weeksAgo--) {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - (weeksAgo * 7) - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      
      const weekId = startDate.toISOString().split('T')[0];
      
      // Check if this week already exists
      const existing = await Workout.findOne({
        userId: user._id,
        weekId,
        isTemplate: false,
      });
      
      if (existing) {
        console.log(`Week ${weekId} already exists, skipping...`);
        continue;
      }
      
      const sampleDays = {
        Sunday: { 
          name: 'Rest Day', 
          exercises: [] 
        },
        Monday: {
          name: 'Chest & Triceps',
          exercises: [
            { name: 'Bench Press', reps: '10', sets: '4', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 86400000) },
            { name: 'Incline Dumbbell Press', reps: '12', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 86400000) },
            { name: 'Tricep Dips', reps: '15', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 86400000) },
            { name: 'Cable Flyes', reps: '12', sets: '3', repsUnit: 'reps', completed: false, completedAt: null },
          ],
        },
        Tuesday: {
          name: 'Back & Biceps',
          exercises: [
            { name: 'Pull-ups', reps: '8', sets: '4', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 172800000) },
            { name: 'Barbell Rows', reps: '10', sets: '4', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 172800000) },
            { name: 'Bicep Curls', reps: '12', sets: '3', repsUnit: 'reps', completed: false, completedAt: null },
            { name: 'Face Pulls', reps: '15', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 172800000) },
          ],
        },
        Wednesday: {
          name: 'Legs',
          exercises: [
            { name: 'Squats', reps: '12', sets: '4', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 259200000) },
            { name: 'Leg Press', reps: '15', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 259200000) },
            { name: 'Lunges', reps: '10', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 259200000) },
            { name: 'Calf Raises', reps: '20', sets: '4', repsUnit: 'reps', completed: false, completedAt: null },
          ],
        },
        Thursday: {
          name: 'Shoulders & Abs',
          exercises: [
            { name: 'Military Press', reps: '10', sets: '4', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 345600000) },
            { name: 'Lateral Raises', reps: '15', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 345600000) },
            { name: 'Planks', reps: '60', sets: '3', repsUnit: 'seconds', completed: true, completedAt: new Date(startDate.getTime() + 345600000) },
          ],
        },
        Friday: {
          name: 'Cardio & Core',
          exercises: [
            { name: 'Running', reps: '30', sets: '1', repsUnit: 'minutes', completed: true, completedAt: new Date(startDate.getTime() + 432000000) },
            { name: 'Mountain Climbers', reps: '20', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 432000000) },
            { name: 'Crunches', reps: '25', sets: '3', repsUnit: 'reps', completed: false, completedAt: null },
          ],
        },
        Saturday: {
          name: 'Full Body',
          exercises: [
            { name: 'Deadlifts', reps: '8', sets: '4', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 518400000) },
            { name: 'Push-ups', reps: '20', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 518400000) },
            { name: 'Burpees', reps: '15', sets: '3', repsUnit: 'reps', completed: true, completedAt: new Date(startDate.getTime() + 518400000) },
          ],
        },
      };
      
      const workout = await Workout.create({
        userId: user._id,
        weekId,
        startDate,
        endDate,
        days: sampleDays,
        isTemplate: false,
        archivedAt: new Date(),
      });
      
      sampleWeeks.push(workout);
      console.log(`✓ Created workout week: ${weekId} (${startDate.toDateString()} - ${endDate.toDateString()})`);
    }
    
    console.log(`\n✅ Successfully created ${sampleWeeks.length} sample workout weeks!`);
    console.log('🔄 Refresh your Workout page and check the History tab.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding workout history:', error);
    process.exit(1);
  }
};

seedWorkoutHistory();
