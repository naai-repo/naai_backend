const mongoose = require('mongoose');

// Schema for Salon
const SalonSchema = new mongoose.Schema({
    address:{
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    name :{
        type: String,
        required: true
    },
    salonType : {
        type: String,
        enum: ["unisex", "men", "women", "not specified"],
        default: "not specified",
        lowercase: true,
        required: true
    },
    timing : {
        opening : {
            type: String,
            required: true
        },
        closing: {
            type: String,
            required: true
        },
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
        unique: true,
        validate: {
            validator: function(val) {
                return val.toString().length === 10
            },
            message: val => `${val.value} has to be 10 digits`
        }
    },
    owner: {
        type: String,
        required: true
    },
    gst: {
        type: String,
        default: "XX-XXXXXXXXX-XX"
    },
    pan: {
        type: String,
        default: "XX-XXXXXXXXX-XX"
    },
    live: {
        type: Boolean,
        default: false
    },
    paid: {
        type: Boolean,
        default: false
    },
    bookings: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    }
},{
    timestamps: true
});

SalonSchema.index({ location: "2dsphere" });

module.exports = new mongoose.model("Salon", SalonSchema);