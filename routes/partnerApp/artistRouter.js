const router = require("express").Router();
const mongoose = require("mongoose");
const Artist = require("../../model/partnerApp/Artist");
const Salon = require("../../model/partnerApp/Salon");
const wrapperMessage = require("../../helper/wrapperMessage");
const jwtVerify = require("../../middleware/jwtVerification");

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Getting and searching the Artists

router.get("/", async (req, res) => {
  try {
    let name = req.query.name;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let queryObject = {};
    if(name){
        queryObject.name = {$regex : name, $options: 'i'};
    }
    
    const data = await Artist.find(queryObject).skip(skip).limit(limit);
    res.status(200).json({ data, hits: data.length });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Adding new Artists, use the above mentioned userId, saloonId and artist Id

router.post("/add", async (req, res) => {
  let newArtist = req.body;
  try {
    if(newArtist.salonId !== "000000000000000000000000"){
      let salonData = await Salon.find({_id: newArtist.salonId});
      if(!salonData.length){
        throw new Error ("No such Salon exists!");
      }
      newArtist = new Artist({
        ...newArtist,
        location : salonData[0].location
      })
      const artist = await newArtist.save();
      res.status(200).json(artist);
    }else{
      newArtist = new Artist({
        ...newArtist,
        location : {
          type: "Point",
          coordinates: [0,0]
        }
      })
      const artist = await newArtist.save();
      res.status(200).json(artist);
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Updating existing artist

router.post("/:id/update", async (req, res) => {
  try{
    let data = await Artist.updateOne({_id: req.params.id}, req.body);
    res.json(wrapperMessage('success', "", data));
  }catch(err){
      console.log(err);
      res.json(wrapperMessage("failed", err.message));
  }
});

router.get('/topArtists', jwtVerify, async (req,res) => {
  try{
      let location = req.user.location;
      let page = Number(req.query.page) || 1;
      let limit = Number(req.query.limit) || 15;
      let skip = (page-1)*limit;
      let data = await Artist.aggregate([
          {
              "$geoNear": {
                  "near": location,
                  "distanceField": "distance",
                  "distanceMultiplier": 0.001
              }
          },
          {
              $sort: {
                  bookings: -1
              }
          },
          {
              $sort: {
                  rating: -1
              }
          },
          {
              $sort: {
                  paid: -1
              }
          },
          // {
          //     $sort: {
          //         distance: 1
          //     }
          // },
      ]).skip(skip).limit(limit);
      res.status(200).json(data);
  }catch(err){
      console.log(err);
      res.status(500).json(wrapperMessage("failed", err.message));
  }
})

module.exports = router;
