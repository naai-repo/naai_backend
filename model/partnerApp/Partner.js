const mongoose = require('mongoose');

// Schema for Partners
const PartnerSchema = new mongoose.Schema({
    name :{
        type: String,
        lowercase: true,
    },
    email :{
        type: String,
        unique:true,
        lowercase: true,
    },
    password :{
        type: String,
    },
    phoneNumber : {
        type: Number,
        unique: true,
        validate: {
            validator: function(val) {
                return val.toString().length === 10
            },
            message: val => `${val.value} has to be 10 digits`
        }
    },
    admin : {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan'
    }
},{
    timestamps: true
});

module.exports = new mongoose.model("Partner", PartnerSchema);