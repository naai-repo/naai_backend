const mongoose = require('mongoose');

const activeSubscriptionSchema = new mongoose.Schema({
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
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active',
    },
    name: {
        type: String,
        // required: true,
    },
    template_name: {
        type: String,
        // required: true,
    },
    duration: {
        type: Number,  // Duration in days
        // required: true,
    },
    price: {
        type: Number,
        // required: true,
    },
    template_price: {
        type: Number,
        // required: true,
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
    

}, {
    timestamps: true,
});

module.exports = mongoose.model('ActiveSubscription', activeSubscriptionSchema);
