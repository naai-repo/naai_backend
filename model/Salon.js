const mongoose = require('mongoose');

// Schema for Salon
const SalonSchema = new mongoose.Schema({
    address:{
        type: String,
        required: true
    },
    location: {
        type: Object,
        required: true
    },
    name :{
        type: String,
        required: true
    },
    salonType : {
        type: String,
        required: true
    },
    timing : {
        type: Object,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    closedOn: {
        type: String,
        required: true
    },
    phoneNumber : {
        type: Number,
        required: true,
        validate: {
            validator: function(val) {
                return val.toString().length === 10
            },
            message: val => `${val.value} has to be 10 digits`
        }
    }
},{
    timestamps: true
});

module.exports = new mongoose.model("Salon", SalonSchema);