const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: String, required: true, },
    salonId: { type: String, required: true, },
    paymentId: { type: String, required: true, },
    paymentStatus: { type: String, required: true, },
    timeSlot: { type: String, required: true, },    //Change it as per requirements
    bookingDate: { type: Date, required: true, },
    artistServiceMap: [
        {
            artistId: { type: String, required: true, },
            serviceId: { type: String, required: true, },
            timeSlot: { type: String, required: true, } //Change it as per requirements
        }
    ]
}, {
    timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;