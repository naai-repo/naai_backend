const router = require('express').Router();
const mongoose = require('mongoose');
const Artist = require('../model/Artist');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

/* 
    Dummy Artists: 
    {
        "name" : "Boho",
        "salonId" : "650066505e403c6686f0077c",
        "services" : [
            {
                "serviceId" : "6500696f54fcc02c38794862",
                "price" : 600
            },
            {
                "serviceId" : "6500698554fcc02c38794866",
                "price" : 600
            },
            {
                "serviceId" : "6500699954fcc02c38794868",
                "price" : 600
            }
        ],
        "phoneNumber" : 9999999999,
        "availability" : {
            "monday" : [20000, 30000],
            "tuesday" : [20000, 30000],
            "wednesday" : [20000, 30000],
            "thursday" : [20000, 30000],
            "friday" : [20000, 30000],
            "saturday" : [20000, 30000],
            "sunday" : [20000, 30000]
        }
    }
*/

// Getting all the Artists
router.get("/", async (req, res) => {
    try{

        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
    
        const data = await Artist.find().skip(skip).limit(limit);
        res.status(200).json({data, hits: data.length});
    }catch(err){
        res.status(500).json(err);
    }
})

// Adding new Artists, use the above mentioned userId, saloonId and artist Id
router.post('/add', async (req, res) => {
    const newArtist = new Artist(req.body);
    try{
        const artist = await newArtist.save();
        res.status(200).json(artist);
    }catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;