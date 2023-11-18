const router = require('express').Router();
const mongoose = require('mongoose');
const Salon = require('../../model/partnerApp/Salon');
const wrapperMessage = require('../../helper/wrapperMessage');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Getting the Salons and searching salons
router.get("/", async (req, res) => {
    try{
        let name = req.query.name;
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
        let queryObject = {};
        if(name){
            queryObject.name = {$regex : name, $options: 'i'};
        }

        const salons = await Salon.find(queryObject).skip(skip).limit(limit);
        res.status(200).json({salons, hits: salons.length});
    }catch(err){
        console.log(err);
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

router.post('/:id/update', async (req, res) => {
    try{
        let data = await Salon.updateOne({_id: req.params.id}, req.body);
        res.json(wrapperMessage('success', "", data));
    }catch(err){
        console.log(err);
        res.json(wrapperMessage("failed", err.message));
    }
})

module.exports = router;