const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  name:String,
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
  pricePaid:{
    type:Number,
    required:true
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
  duration: {
    type: Number,  // Duration in days
    required: true,
},
  
});

membershipSchema.pre('save', async function (next) {
    console.log(this.subscription)
//   const subscription = await mongoose.model('Subscription').findById(this.subscription);
//   this.endDate = new Date(this.startDate.getTime() + (subscription.duration * 24 * 60 * 60 * 1000));
  next();
});

module.exports = mongoose.model('Membership', membershipSchema);
