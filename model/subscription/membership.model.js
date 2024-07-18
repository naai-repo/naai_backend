const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
  },
  subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
  },
  startDate: {
      type: Date,
      default: Date.now,
  },
  endDate: {
      type: Date,
      required: true,
  },
  isActive: {
      type: Boolean,
      default: true,
  },
});

membershipSchema.pre('save', async function (next) {
  const subscription = await mongoose.model('Subscription').findById(this.subscription);
  this.endDate = new Date(this.startDate.getTime() + (subscription.duration * 24 * 60 * 60 * 1000));
  next();
});

module.exports = mongoose.model('Membership', membershipSchema);
