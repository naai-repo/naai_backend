const mongoose = require('mongoose');

const promotionHistorySchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
  },
  message:{
type:String
  },
  customersCount: {
    type: Number
  },
  smsCost: {
    type: Number,
    required: true,
  },
  status:{ },
  smsResponse:{}
  ,  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const PromotionHistory = mongoose.model('PromotionHistory', promotionHistorySchema);

module.exports = PromotionHistory;
