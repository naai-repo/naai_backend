const router = require('express').Router();
const mongoose = require('mongoose');
const Review = require('../../model/partnerApp/Review');
const Artist = require('../../model/partnerApp/Artist');
const jwtVerify = require('../../middleware/jwtVerification');
const wrapperMessage = require('../../helper/wrapperMessage');
const { updateSalonRating, updateArtistRating } = require('../../helper/updateRating');

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
router.post('/add', jwtVerify, async (req, res) => {
    try{
        let userId = req.user.id;
        let salonId = req.body.salonId;
        let artistId = req.body.artistId;
        let newReview = {
                title: req.body.title,
                description: req.body.description,
                userId: userId,
                rating: req.body.rating
            };
        if(artistId){
            let artistData = await Artist.find({_id: artistId});
            salonId = artistData[0].salonId;
            newReview = new Review(
                {
                    ...newReview,
                    artistId: artistId,
                    salonId: salonId,
                }
            )
        }else if(salonId){
            newReview = new Review(
                {
                    ...newReview,
                    salonId: salonId,
                }
            )
        }else{
            const err = new Error('SalonId or ArtistId is required!')
            err.code = 400;
            throw err; 
        }

        let review = await newReview.save();
        await updateSalonRating(salonId);
        if(artistId){
            await updateArtistRating(artistId);
        }
        res.status(200).json(wrapperMessage("success", "", review));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

router.post("/:id/reply", jwtVerify, async (req,res) => {
    try{
        let userId = req.user.id;
        let {title, description} = req.body;
        let newReply = new Review({
            title,
            description,
            userId
        });
        let reply = await newReply.save();
        let relatedReview = await Review.find({_id: req.params.id});
        relatedReview = relatedReview[0];
        relatedReview.replies.push(reply._id);
        await relatedReview.save();
        res.status(200).json(wrapperMessage("success", "", reply));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

module.exports = router;