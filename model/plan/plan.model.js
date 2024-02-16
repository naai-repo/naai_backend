const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  durationInMonths: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },

}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
