const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    template_name: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,  // Duration in days
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    template_price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    features: [{
        type: String,
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    supportLevel: {
        type: String,
        enum: ['basic', 'premium'],
    },
    addOnOptions: [{
        type: String,
    }],
    billingCycle: {
        type: String,
        enum: ['monthly', 'quarterly' , 'yearly'],
        default: 'monthly',
    },
    cancellationPolicy: {
        type: String,
    },
    termsAndConditions: {
        type: String,
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

subscriptionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
