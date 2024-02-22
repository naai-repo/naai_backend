const mongoose = require('mongoose');
const CommonUtils = require('../../helper/commonUtils');

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
        type: mongoose.Schema.Types.Decimal128,
        transform: v => v == null ? '' : v,
        min: 0,
        set: v => Number(v).toFixed(2),
        get: CommonUtils.getDouble,
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
    toJSON: { getters: true, virtuals: false},
});

module.exports = new mongoose.model("Review", ReviewSchema);