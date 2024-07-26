
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for Commission brackets
const commissionBracketSchema = new Schema({
    revenue_from: { type: Number, required: true },
    revenue_to: { type: Number, required: true },
    type: { type: Number, required: true, enum: [0,1]}, //  0 is percent 1 is value
    value: { type: Number, required: true }
});

// Define the schema for Commission
const commissionSchema = new Schema({
    salon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salon',
        default:null,
    
    },
    partnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner',
        default:null,

    },
    name:{ type: String, required: true },
    brackets: [commissionBracketSchema],
    duration_type: { 
        type: Number, 
        required: true,
        enum: [0, 1],
    }, //  1 represents monthly duration type nad 0 represents weekly
    active: { type: Boolean, required: true }
});

module.exports = mongoose.model('Commission', commissionSchema);
