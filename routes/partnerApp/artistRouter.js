const router = require("express").Router();
const mongoose = require("mongoose");
const Artist = require("../../model/partnerApp/Artist");
const Salon = require("../../model/partnerApp/Salon");
const Booking = require("../../model/partnerApp/Booking");
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

router.get('/single/:id', async (req, res) => {
  try{
      let data = await Artist.findOne({_id: req.params.id});
      res.json(wrapperMessage('success', "", data));
  }catch(err){
      console.log(err);
      res.json(wrapperMessage("failed", err.message));
  }
})

router.post('/topArtists', async (req,res) => {
  try{
      let location = req.body.location; 
      let page = Number(req.query.page) || 1;
      let limit = Number(req.query.limit) || 15;
      let skip = (page-1)*limit;
      let artists = await Artist.aggregate([
          {
              "$geoNear": {
                  "near": location,
                  "distanceField": "distance",
                  "distanceMultiplier": 0.001
              }
          }
      ]);
      let totalBookings = await Booking.find().count("val");
      let totalArtists = await Artist.find().count("artist");
      let maxDistance = 0;
      let maxRating = 5;
      let avgBookings = totalBookings / totalArtists;
      let end = 0;
      if(artists.length < 1000){
        maxDistance = artists[artists.length - 1].distance
        end = artists.length-1;
      }else{
        maxDistance = artists[1000].distance
        end = 1000;
      }

      for(let itr = 0; itr <= end; itr++ ){
        let artist = artists[itr];
        let bookings = artist.bookings >= avgBookings ? avgBookings : artist.bookings;
        let score = 0;
        score = (((maxDistance - artist.distance) / maxDistance)*0.5)
                + ((artist.rating / maxRating)*0.3)
                + ((bookings / avgBookings)*0.2);
        
        if(artist.paid){
          score += 0.2
        }

        artists[itr]["score"] = score;
      }
      artists.sort((a,b) => {
        if(a.score < b.score)
          return 1
        else if (a.score > b.score)
          return -1
        else return 0
      })
      let data = [];
      for(let itr = skip; itr<skip+limit; itr++){
        if(!artists[itr]){
          break;
        }
        data.push(artists[itr]);
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
      let artists = await Artist.aggregate([
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
      if(artists.length < 1000){
          maxDistance = artists[artists.length - 1].distance
          end = artists.length-1;
      }else{
          maxDistance = artists[1000].distance
          end = 1000;
      }

      if(filter === "rating"){
          let maxRating = 5;
          for(let itr = 0; itr <= end; itr++ ){
              let artist = artists[itr];
              let score = 0;
              score = (((maxDistance - artist.distance) / maxDistance)*0.4)
                      + ((artist.rating / maxRating)*0.4);
              
              if(artist.paid){
                score += 0.2
              }
  
              artists[itr]["score"] = score;
          }
      }

      artists.sort((a,b) => {
          if(a.score < b.score)
          return 1
          else if (a.score > b.score)
          return -1
          else return 0
      })
      let data = [];
      for(let itr = skip; itr<skip+limit; itr++){
          if(!artists[itr]){
          break;
          }
          data.push(artists[itr]);
      }
      res.status(200).json(wrapperMessage("success", "", data));
  }catch(err){
      console.log(err);
      res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
})

module.exports = router;
