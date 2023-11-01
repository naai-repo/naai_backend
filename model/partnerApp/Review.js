const mongoose = require('mongoose');

// Schema for Artists
const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    rating: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    saloonId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    artistId: {
        type: mongoose.Schema.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

module.exports = new mongoose.model("Review", ReviewSchema);