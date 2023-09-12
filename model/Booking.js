const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
    },
    salonId: { 
        type: mongoose.Schema.ObjectId, 
        required: true, 
    },
    paymentId: { 
        type: String, 
        required: true, 
    },
    paymentStatus: { 
        type: String, 
        required: true, 
    },
    timeSlot: { 
        start: {
            type: Number, 
            required: true, 
        },
        end: {
            type: Number, 
            required: true
        }
    },    //Change it as per requirements
    bookingDate: { 
        type: Date, 
        required: true, 
    },
    artistServiceMap: [
        {
            artistId: { 
                type: mongoose.Schema.ObjectId, 
                required: true, 
            },
            serviceId: { 
                type: mongoose.Schema.ObjectId, 
                required: true, 
            },
            timeSlot: { 
                start: {
                    type: Number, 
                    required: true, 
                },
                end: {
                    type: Number, 
                    required: true
                } 
            } //Change it as per requirements
        }
    ]
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;