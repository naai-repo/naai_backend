const router = require("express").Router();
const mongoose = require("mongoose");
const wrapperMessage = require("../../helper/wrapperMessage");
const jwtVerify = require("../../middleware/jwtVerification");
const CommonUtils = require("../../helper/commonUtils");
const User = require("../../model/customerApp/User");

router.post("/add/user", async (req, res) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    let user = await User.findOne({ phoneNumber: phoneNumber });
    if (user) {
      let data = {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      };
      res
        .status(200)
        .json(wrapperMessage("success", "User already exists", data));
      return;
    }
    let newUser = new User({
      phoneNumber: phoneNumber,
      userType: "walkin",
    });
    let data = await newUser.save();
    res
      .status(200)
      .json(wrapperMessage("success", "Walkin user added successfully", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.get("/users", async (req, res) => {
  try {
    let data = await User.find({ userType: "walkin" });
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Routes for walkin booking creation!
module.exports = router;
