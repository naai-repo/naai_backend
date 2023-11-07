const router = require("express").Router();
const User = require("../../model/customerApp/User");
const Salon = require("../../model/partnerApp/Salon");
const wrapperMessage = require("../../helper/wrapperMessage");


// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Setting user's Location

router.post("/set", async (req, res) => {
  try{
    let {userId, coords} = req.body;
    if(!userId){
      throw new Error("User Id cannot be empty");
    }
    if(!coords.length){
      throw new Error("Coordinated cannot be empty");
    }
    let data = await User.updateOne({_id: userId}, {
      location: {
        type: "Point",
        coordinates: coords
      }
    });
    res.json(wrapperMessage("success", "User location updated successfully!"));
  }catch(err){
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
})

// Getting a particular user's Location

router.get("/:id", async (req, res) => {
  try{
    let data = await User.find({_id: req.params.id});
    if(!data.length){
      throw new Error("An error occured while Getting user's Location!");
    }
    res.json(wrapperMessage("success", "", [data[0].location]));
  }catch(err){
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
})

// Getting closest Salons to User

router.get("/:id/salons", async (req, res) => {
  try{
    let dist = Number(req.query.distance);
    let data = await User.find({_id: req.params.id});
    if(!data.length){
      throw new Error("An error occured while Getting user's Location!");
    }
    data = data[0];
    let salonData = await Salon.find({
      location: {
        $near: {
          $geometry: data.location,
          $maxDistance: dist * 1000,
        }
      }
    })
    if(!salonData){
      throw new Error("An error occured while finding the closest Salons!");
    }
    res.json(wrapperMessage("success", "", [{salonData, hits: salonData.length}]));
  }catch(err){
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
})

module.exports = router;
