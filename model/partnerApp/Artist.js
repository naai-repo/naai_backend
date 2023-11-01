const mongoose = require('mongoose');

// Schema for Artists
const ArtistSchema = new mongoose.Schema({
    name :{
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    salonId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    services: [{
        serviceId : {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
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
    availability: {
        monday: [{
            type: Number,
        }],
        tuesday: [{
            type: Number,
        }],
        wednesday: [{
            type: Number,
        }],
        thursday: [{
            type: Number,
        }],
        friday: [{
            type: Number,
        }],
        saturday: [{
            type: Number,
        }],
        sunday: [{
            type: Number,
        }]
    }
},{
    timestamps: true
});

module.exports = new mongoose.model("Artist", ArtistSchema);