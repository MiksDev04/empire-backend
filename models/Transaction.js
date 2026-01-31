import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    item: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Type is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
