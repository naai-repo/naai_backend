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
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('ActiveSubscription', activeSubscriptionSchema);
