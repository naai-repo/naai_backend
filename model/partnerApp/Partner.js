const mongoose = require('mongoose');

// Schema for Partners
const PartnerSchema = new mongoose.Schema({
    name :{
        type: String,
  
    },
    email :{
        type: String,
        unique:true

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
    }
},{
    timestamps: true
});

module.exports = new mongoose.model("Partner", PartnerSchema);