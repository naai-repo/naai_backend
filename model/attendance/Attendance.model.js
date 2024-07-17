const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    salonId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Salon',
        required: true,
    },
    staffId: {
        type: Number,
        required: true,
    },
    markedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'Partner',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    punchIn: {
        type: Date,
    },
    punchOut: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Attendance = new mongoose.model('Attendance', AttendanceSchema);
module.exports = Attendance;