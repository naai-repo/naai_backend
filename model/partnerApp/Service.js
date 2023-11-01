const mongoose = require('mongoose');

// Schema for Service
const ServiceSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    serviceTitle: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
    },
    targetGender: {
        type: String,
        required: true
    },
    salonIds: [
        {
            type: mongoose.Schema.ObjectId,
            required: true
        },
    ],
    avgTime: {
        type: Number,
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = new mongoose.model("Service", ServiceSchema);