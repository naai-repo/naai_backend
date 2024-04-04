const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle:{
    type: String,
    enum: ["monthly","quaterly", "bi-annually", "annually"],
    required: true,
    lowercase: true
  },
  durationInMonths: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  type:{
    type: String,
    enum: ["partner", "customer"],
    required: true
  },
  features: []
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
