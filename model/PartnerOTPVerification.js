const mongoose = require('mongoose');

// Schema for Partners
const PartnerOTPVerificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    }
});

module.exports = new mongoose.model("PartnerOTPVerification", PartnerOTPVerificationSchema);