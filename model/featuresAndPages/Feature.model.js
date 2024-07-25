const mongoose = require('mongoose');

const FeatureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    feature_name: {
        type: String,
        required: true,
    },
    feature_type: {
        type: String,
        enum: ["page", "component"],
        required: true,
    },
    permissions: [
        {
            type: String,
            required: true,
        }
    ],
}, {
    timestamps: true,
});

const Features = new mongoose.model('Feature', FeatureSchema);
module.exports = Features;