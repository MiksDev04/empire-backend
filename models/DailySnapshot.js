import mongoose from 'mongoose';

const dailySnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  // Financial metrics
  income: {
    type: Number,
    default: 0,
  },
  expenses: {
    type: Number,
    default: 0,
  },
  savings: {
    type: Number,
    default: 0,
  },
  totalBalance: {
    type: Number,
    default: 0,
  },
  // Goals metrics
  goalsCompleted: {
    type: Number,
    default: 0,
  },
  totalGoals: {
    type: Number,
    default: 0,
  },
  // Workout metrics
  workoutCompleted: {
    type: Boolean,
    default: false,
  },
  workoutName: {
    type: String,
    default: '',
  },
  exercisesCompleted: {
    type: Number,
    default: 0,
  },
  totalExercises: {
    type: Number,
    default: 0,
  },
  // Journal metrics
  journalsWritten: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one snapshot per user per day
dailySnapshotSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for querying snapshots by date range
dailySnapshotSchema.index({ user: 1, date: -1 });

export default mongoose.model('DailySnapshot', dailySnapshotSchema);
