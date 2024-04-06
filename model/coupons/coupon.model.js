const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    salonId: {
        type: mongoose.Schema.ObjectId,
        default: process.env.NULL_OBJECT_ID,
    },
    min_cart_value:{
        type: Number,
        default: 0
    },
    max_value: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    rules: {
        categories: [
            {
                type: String,
            }
        ],
        modeOfPayment: {
            type: String,
            enum: ['all', 'card', 'cash', 'upi'],
            default: 'all',
        }
    }
}, {
    timestamps: true,
});

const Coupons = new mongoose.model('Coupon', CouponSchema);
module.exports = Coupons;