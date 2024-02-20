const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentReferenceId: {
      type: String,
      required: true,
      unique: true 
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "authorized", "captured", "failed", "refunded"] 
    },
    createdAt: {
      type: Date,
      default: Date.now 
    },
    updatedAt: {
      type: Date,
      default: Date.now 
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    plan: {
      type: mongoose.Schema.ObjectId,
      ref: 'Plan' 
    }
  });

  const Transaction = mongoose.model('transaction', transactionSchema);

module.exports = Transaction;