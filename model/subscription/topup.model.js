// models/SmsTopUpPackage.js
const mongoose = require('mongoose');

const TopUpPackageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    credits: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    type:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model('TopUpPackage', TopUpPackageSchema);
