const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productUsageSchema = new Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    amountUsed: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
}, { timestamps: true });

module.exports = mongoose.model('ProductUsage', productUsageSchema);
