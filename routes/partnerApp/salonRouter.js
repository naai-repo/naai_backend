const router = require('express').Router();
const mongoose = require('mongoose');
const Salon = require('../../model/partnerApp/Salon');
const Booking = require('../../model/partnerApp/Booking');
const Artist = require('../../model/partnerApp/Artist');
const wrapperMessage = require('../../helper/wrapperMessage');
const jwtVerify = require('../../middleware/jwtVerification');

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

router.get('/single/:id', async (req, res) => {
    try{
        let data = await Salon.findOne({_id: req.params.id});
        res.json(wrapperMessage('success', "", data));
    }catch(err){
        console.log(err);
        res.json(wrapperMessage("failed", err.message));
    }
})

router.post('/topSalons', async (req,res) => {
    try{
        let location = req.body.location;
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
        let salons = await Salon.aggregate([
            {
                "$geoNear": {
                    "near": location,
                    "distanceField": "distance",
                    "distanceMultiplier": 0.001
                }
            },
        ]);
        let totalBookings = await Booking.find().count("bookings");
        let totalSalons = await Salon.find().count("salons");
        let maxDistance = 0;
        let maxRating = 5;
        let maxDiscount = 50;
        let avgBookings = totalBookings / totalSalons;
        let end = 0;
        if(salons.length < 1000){
            maxDistance = salons[salons.length - 1].distance
            end = salons.length-1;
        }else{
            maxDistance = salons[1000].distance
            end = 1000;
        }

        for(let itr = 0; itr <= end; itr++ ){
            let salon = salons[itr];
            let bookings = salon.bookings >= avgBookings ? avgBookings : salon.bookings;
            let score = 0;
            score = (((maxDistance - salon.distance) / maxDistance)*0.6)
                    + ((salon.discount / maxDiscount)*0.3)
                    + ((salon.rating / maxRating)*0.07)
                    + ((bookings / avgBookings)*0.03);
            
            if(salon.paid){
                score += 0.2
            }

            salons[itr]["score"] = score;
        }
        salons.sort((a,b) => {
            if(a.score < b.score)
            return 1
            else if (a.score > b.score)
            return -1
            else return 0
        })
        let data = [];
        for(let itr = skip; itr<skip+limit; itr++){
            if(!salons[itr]){
            break;
            }
            data.push(salons[itr]);
        }
        res.status(200).json(wrapperMessage("success", "", data));
    }catch(err){
        console.log(err);
        res.status(500).json(wrapperMessage("failed", err.message));
    }
})

router.post("/filter", async (req,res) => {
    try{
        let filter = req.query.filter.toLowerCase();
        if(!filter){
            let error = new Error("Invalid filter selected!");
            error.code = 400;
            throw error;
        }
        let location = req.body.location;
        if(!location){
            let error = new Error("Invalid location selected!");
            error.code = 400;
            throw error;
        }
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
        let salons = await Salon.aggregate([
            {
                "$geoNear": {
                    "near": location,
                    "distanceField": "distance",
                    "distanceMultiplier": 0.001
                }
            },
        ]);
        let maxDistance = 0;
        let end = 0;
        if(salons.length < 1000){
            maxDistance = salons[salons.length - 1].distance
            end = salons.length-1;
        }else{
            maxDistance = salons[1000].distance
            end = 1000;
        }

        if(filter === "discount"){
            let maxDiscount = 50;
            for(let itr = 0; itr <= end; itr++ ){
                let salon = salons[itr];
                let score = 0;
                score = (((maxDistance - salon.distance) / maxDistance)*0.4)
                        + ((salon.discount / maxDiscount)*0.4);
                
                if(salon.paid){
                    score += 0.2
                }
    
                salons[itr]["score"] = score;
            }

        }else if(filter === "rating"){
            let maxRating = 5;
            for(let itr = 0; itr <= end; itr++ ){
                let salon = salons[itr];
                let score = 0;
                score = (((maxDistance - salon.distance) / maxDistance)*0.4)
                        + ((salon.rating / maxRating)*0.4);
                
                if(salon.paid){
                score += 0.2
                }
    
                salons[itr]["score"] = score;
            }
        }

        salons.sort((a,b) => {
            if(a.score < b.score)
            return 1
            else if (a.score > b.score)
            return -1
            else return 0
        })
        let data = [];
        for(let itr = skip; itr<skip+limit; itr++){
            if(!salons[itr]){
            break;
            }
            data.push(salons[itr]);
        }
        res.status(200).json(wrapperMessage("success", "", data));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

module.exports = router;