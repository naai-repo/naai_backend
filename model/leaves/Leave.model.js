const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    salonId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Salon',
        required: true,
    },
    staffId: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    leave_type: {
        type: String,
        enum: ["paid", "unpaid"],
        required: true,
    },
    leave_category: {
        type: String,
        enum: ["quarter day absent", "half day absent", "full day absent"],
        required: true,
    }

}, {
    timestamps: true,
});

const Leave = new mongoose.model('Leave', LeaveSchema);
module.exports = Leave;