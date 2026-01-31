import mongoose from 'mongoose';

const trashSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['goal', 'workout', 'budget', 'journal'],
    },
    originalId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    trashedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    // Auto-delete after 30 days
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
trashSchema.index({ user: 1, trashedAt: -1 });

const Trash = mongoose.model('Trash', trashSchema);

export default Trash;
