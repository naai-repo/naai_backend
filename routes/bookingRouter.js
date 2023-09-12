const router = require('express').Router();
const mongoose = require('mongoose');
const Booking = require('../model/Booking');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

/* 
    Dummy Bookings: 
    {
        "userId" : "123",
        "salonId" : "650066505e403c6686f0077c",
        "paymentId" : "12345",
        "paymentStatus" : "Success",
        "timeSlot" : {
            "start": 1200,
            "end": 1300
        },
        "bookingDate" : "2023-09-12",
        "artistServiceMap": [
            {
                "artistId" : "65006c2a8bed8cf44a782f4a",
                "serviceId" : "6500696f54fcc02c38794862",
                "timeSlot" : {
                    "start": 1200,
                    "end": 1300
                }
            },
            {
                "artistId" : "65006c2a8bed8cf44a782f4a",
                "serviceId" : "6500698554fcc02c38794866",
                "timeSlot" : {
                    "start": 1400,
                    "end": 1500
                }
            }
        ]
    }
*/

// Getting all the Bookings
router.get("/", async (req, res) => {
    try{

        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
    
        const data = await Booking.find().skip(skip).limit(limit);
        res.status(200).json({data, hits: data.length});
    }catch(err){
        res.status(500).json(err);
    }
})

// Adding new Bookings, use the above mentioned userId, saloonId and artist Id
router.post('/add', async (req, res) => {
    const newBooking = new Booking(req.body);
    try{
        const booking = await newBooking.save();
        res.status(200).json(booking);
    }catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;