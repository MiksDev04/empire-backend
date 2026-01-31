import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Journal title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Journal content is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Journal date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
journalSchema.index({ user: 1, date: -1 });

const Journal = mongoose.model('Journal', journalSchema);

export default Journal;
