const mongoose = require('mongoose');

// Schema for Service
const ServiceSchema = new mongoose.Schema({
    salonId: mongoose.Schema.ObjectId,
    category: {
        type: String,
        lowercase: true,
        required: true
    },
    serviceTitle: {
        type: String,
        required: true,
        lowercase: true
    },
    description: {
        type: String,
    },
    targetGender: {
        type: String,
        lowercase: true,
        required: true
    },
    avgTime: {
        type: Number,
        required: true,
        default: 1
    },
    productsUsed: [{
        product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
        usagePerService: Number 
    }],
    variables: [
        {
            variableType: {
                type: String,
                lowercase: true,
                required: true
            },
            variableName: {
                type: String,
                lowercase: true,
                required: true
            },
            variablePrice: {
                type: mongoose.Schema.Types.Decimal128,
                required: true,
                default: 0,
                set: v => Number(v).toFixed(2)
            },
            variableCutPrice: {
                type: mongoose.Schema.Types.Decimal128,
                required: true,
                default: 0,
                set: v => Number(v).toFixed(2)
            },
            variableTime: {
                type: Number,
                required: true,
                default: 0
            }
        }
    ],
    basePrice: {
        type: mongoose.Schema.Types.Decimal128,
        set: v => Number(v).toFixed(2)
    },
    cutPrice: {
        type: mongoose.Schema.Types.Decimal128,
        set: v => Number(v).toFixed(2)
    },
}, {
    timestamps: true
},
);

module.exports = new mongoose.model("Service", ServiceSchema);