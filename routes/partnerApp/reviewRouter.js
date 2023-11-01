const router = require('express').Router();
const mongoose = require('mongoose');
const Review = require('../../model/partnerApp/Review');

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Getting all the reviews
router.get("/", async (req, res) => {
    try{

        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
    
        const data = await Review.find().skip(skip).limit(limit);
        res.status(200).json({data, hits: data.length});
    }catch(err){
        res.status(500).json(err);
    }
})

// Getting particular Review
router.get('/:id', async (req, res) => {
    try{
        
        const data = await Review.find({_id: req.params.id});
        if(!data.length){
            res.status(404);
            throw new Error("No such Review exists!");
            
        }
        res.status(200).json({data, hits: data.length});
    }catch(err){
        console.log(err);
        res.json({
            status: 'failed',
            message: err.message,
            data: []
        });
    }
})

// Adding new Reviews, use the above mentioned userId, saloonId and artist Id
router.post('/add', async (req, res) => {
    const newReview = new Review(req.body);
    try{
        const review = await newReview.save();
        res.status(200).json(review);
    }catch(err){
        res.status(500).json(err);
    }
})

module.exports = router;