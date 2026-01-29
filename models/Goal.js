import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, { _id: true });

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      minlength: [3, 'Goal title must be at least 3 characters'],
    },
    tasks: {
      type: [taskSchema],
      validate: {
        validator: function(tasks) {
          return tasks.length > 0;
        },
        message: 'A goal must have at least one task',
      },
    },
    completed: {
      type: Boolean,
      default: false,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
goalSchema.index({ user: 1, completed: 1 });
goalSchema.index({ user: 1, createdAt: -1 });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
