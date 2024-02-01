const mongoose = require('mongoose');

// Schema for Service
const ServiceSchema = new mongoose.Schema({
    salonId: mongoose.Schema.ObjectId,
    category: {
        type: String,
        lowercase: true,
        required: true
    },
    sub_category: {
        type: String,
        lowercase: true,
    },
    serviceTitle: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    targetGender: {
        type: String,
        required: true
    },
    avgTime: {
        type: Number,
        required: true,
        default: 1
    },
    basePrice: Number
}, {
    timestamps: true
});

module.exports = new mongoose.model("Service", ServiceSchema);