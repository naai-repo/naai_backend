const mongoose = require('mongoose');

const DeletedUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    phoneNumber: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
        default: "No reason provided."
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports  = new mongoose.model('DeletedUser', DeletedUserSchema);