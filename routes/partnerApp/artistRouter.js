const router = require("express").Router();
const mongoose = require("mongoose");
const Artist = require("../../model/partnerApp/Artist");
const Salon = require("../../model/partnerApp/Salon");
const wrapperMessage = require("../../helper/wrapperMessage");

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Getting all the Artists
router.get("/", async (req, res) => {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;

    const data = await Artist.find().skip(skip).limit(limit);
    res.status(200).json({ data, hits: data.length });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Adding new Artists, use the above mentioned userId, saloonId and artist Id
router.post("/add", async (req, res) => {
  let newArtist = req.body;
  try {
    let salonData = await Salon.find({_id: newArtist.salonId});
    newArtist = new Artist({
      ...newArtist,
      location : salonData[0].location
    })
    const artist = await newArtist.save();
    res.status(200).json(artist);
  } catch (err) {
    res.status(500).json(err);
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

module.exports = router;
