const mongoose = require('mongoose');

// Schema for Artists
const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        default: '',
        lowercase: true,
    },
    description: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        transform: v => v == null ? '' : v,
        min: 0,
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    salonId: {
        type: mongoose.Schema.ObjectId,
        transform: v => v == null ? '' : v
    },
    artistId: {
        type: mongoose.Schema.ObjectId,
        transform: v => v == null ? '' : v
    },
    replies: [{
        type: mongoose.Schema.ObjectId
    }]
}, {
    timestamps: true,
});

module.exports = new mongoose.model("Review", ReviewSchema);