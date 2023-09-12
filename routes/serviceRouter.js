const router = require('express').Router();
const mongoose = require('mongoose');
const Service = require('../model/Service');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

/* 
    Dummy Service:
    {
        "category" : "Hair",
        "serviceTitle": "Hair Wash",
        "description" : "This is description",
        "targetGender" : "Male",
        "salonIds" : ["650066505e403c6686f0077c", "650066e35e403c6686f00784", "650067105e403c6686f00786"],
        "avgTime" : 12345,
        "basePrice" : 500
    }
*/

// Getting all the Services
router.get("/", async (req, res) => {
    try{

        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
    
        const data = await Service.find().skip(skip).limit(limit);
        res.status(200).json({data, hits: data.length});
    }catch(err){
        res.status(500).json(err);
    }
})

// Adding new Services, use the above mentioned userId, saloonId and artist Id
router.post('/add', async (req, res) => {
    const newService = new Service(req.body);
    try{
        const service = await newService.save();
        res.status(200).json(service);
    }catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;