const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSalesSchema = new Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantitySold: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
    salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },

},    { timestamps: true });

module.exports = mongoose.model('ProductSales', productSalesSchema);
