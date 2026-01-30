import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sets: {
    type: String,
    required: true,
  },
  reps: {
    type: String,
    required: true,
  },
  repsUnit: {
    type: String,
    enum: ['reps', 'seconds', 'minutes', 'hours'],
    default: 'reps',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const daySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  exercises: [exerciseSchema],
});

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    weekId: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    days: {
      Sunday: daySchema,
      Monday: daySchema,
      Tuesday: daySchema,
      Wednesday: daySchema,
      Thursday: daySchema,
      Friday: daySchema,
      Saturday: daySchema,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for faster queries
workoutSchema.index({ userId: 1, weekId: 1 });
workoutSchema.index({ userId: 1, isTemplate: 1 });

export default mongoose.model('Workout', workoutSchema);
