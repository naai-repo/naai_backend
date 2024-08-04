const mongoose = require('mongoose');

const promotionHistorySchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
  }],
  smsCost: {
    type: Number,
    required: true,
  },
  smsResponse: {
    type: Object, // Adjust the type based on the structure of the response
    required: false,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const PromotionHistory = mongoose.model('PromotionHistory', promotionHistorySchema);

module.exports = PromotionHistory;
