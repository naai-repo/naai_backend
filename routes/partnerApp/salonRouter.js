const router = require('express').Router();
const mongoose = require('mongoose');
const Salon = require('../../model/partnerApp/Salon');
const wrapperMessage = require('../../helper/wrapperMessage');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Getting all the Salons
router.get("/", async (req, res) => {
    try{

        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
    
        const data = await Salon.find().skip(skip).limit(limit);
        res.status(200).json({data, hits: data.length});
    }catch(err){
        res.status(500).json(err);
    }
})

// Adding new Salons, use the above mentioned userId, saloonId and artist Id
router.post('/add', async (req, res) => {
    const newSalon = req.body;
    try{
        newSalon.location = {
            type: "Point",
            coordinates: newSalon.location.coordinates
        }
        const salon = await new Salon(newSalon).save();
        res.status(200).json(salon);
    }catch(err){
        console.log(err);
        res.status(500).json(wrapperMessage("failed", err.message));
    }
})

module.exports = router;