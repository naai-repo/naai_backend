const router = require("express").Router();
const bcrypt = require("bcrypt");

const User = require("../../model/customerApp/User");
const wrapperMessage = require("../../helper/wrapperMessage");
const sendOTPVerification = require("../../helper/sendOTPVerification");
const jwtVerify = require("../../middleware/jwtVerification");
const DeletedUser = require("../../model/DeletedUser");

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// User Signup / Login
router.post("/login", (req, res) => {
  let { phoneNumber } = req.body;
  // checking if user already exists

  User.find({ phoneNumber })
    .then((result) => {
      if (result.length) {
        // User Already exists
        sendOTPVerification(result[0], res);
      } else {
        // try to create new user
        const newUser = new User({
          phoneNumber,
        });
        newUser
          .save()
          .then((result) => {
            sendOTPVerification(result, res);
          })
          .catch((err) => {
            console.log(err);
            res.json(
              wrapperMessage(
                "failed",
                "An error occured while saving the User!"
              )
            );
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json(
        wrapperMessage(
          "failed",
          "An error occured while checking existing User!"
        )
      );
    });
});

// Forget Password Routes
router.post("/forgotPassword", async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    if (!phoneNumber) {
      throw new Error("Please enter valid phone number!");
    } else {
      let data = await User.find({ phoneNumber });
      if (!data.length) {
        throw new Error(
          "No account found with this phone number! Please Enter correct phone number."
        );
      } else {
        sendOTPVerification(data[0], res);
      }
    }
  } catch (err) {
    res.json(wrapperMessage("failed", err.message));
  }
});

router.post("/update", async (req, res) => {
  try {
    let { userId, data } = req.body;
    if (data.name) {
      if (!/^[a-zA-Z ]*$/.test(data.name)) {
        throw new Error("Please enter a Valid name!");
      }
    }
    if (data.email) {
      let userEmail = await User.findOne({ email: data.email });
      if (userEmail && userEmail._id.toString() !== userId) {
        throw new Error("This email is already registered!");
      }
    }
    let userData = await User.findOne({ _id: userId });
    if (!userData) {
      throw new Error("No such user exits!");
    }
    let result = await User.updateOne({ _id: userId }, data);
    res.json(wrapperMessage("success", "User Updated successfully", result));
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
});

router.get("/delete", jwtVerify, async (req, res) => {
  try {
    let userId = req.user.id;
    let user = await User.findOne({ _id: userId });
    if (!user) {
      let err = new Error("User does not exist!");
      err.code = 404;
      throw err;
    }
    let deletedUser = new DeletedUser({
      userId: userId,
      phoneNumber: user.phoneNumber,
      reason: req.query.reason || "No reason provided",
    });
    await deletedUser.save();
    let data = await User.deleteOne({ _id: userId });
    res
      .status(200)
      .json(wrapperMessage("success", "user successfully Deleted!"));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!req.params.id) {
      let err = new Error("User ID is required!");
      err.code = 400;
      throw err;
    }
    let user = await User.findOne({ _id: req.params.id });
    if (!user) {
      let deletedUser = await DeletedUser.findOne({ userId: req.params.id });
      if (!deletedUser) {
        let err = new Error("User does not exist!");
        err.code = 404;
        throw err;
      }
      user = {
        userId: deletedUser.userId,
        name: "Deleted User",
        email: "",
        gender: "",
        phoneNumber: "XXXXXXXXXX",
        location: { type: "Point", coordinates: [0, 0] },
        verified: false,
        status: "deleted",
      };
    }
    res.status(200).json(wrapperMessage("success", "", user));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.get("/favourite/get", jwtVerify, async (req, res) => {
  try {
    let userId = req.user.id;
    let user = await User.findOne({ _id: userId });
    if (!user) {
      let err = new Error("User does not exist!");
      err.code = 404;
      throw err;
    }
    res.status(200).json(wrapperMessage("success", "", user.favourite));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/favourite/add", jwtVerify, async (req, res) => {
  try {
    let userId = req.user.id;
    let user = await User.findOne({ _id: userId });
    if (!user) {
      let err = new Error("User does not exist!");
      err.code = 404;
      throw err;
    }
    let salonArr = user.favourite.salons.map((obj) => obj.toString());
    let artistArr = user.favourite.artists.map((obj) => obj.toString());
    let added = true;
    if (req.body.salon) {
      if (salonArr.includes(req.body.salon)) {
        user.favourite.salons = salonArr.filter(
          (val) => val !== req.body.salon
        );
        added = false;
      } else {
        user.favourite.salons.push(req.body.salon);
      }
    }
    if (req.body.artist) {
      if (artistArr.includes(req.body.artist)) {
        user.favourite.artists = artistArr.filter(
          (val) => val !== req.body.artist
        );
        added = false;
      } else {
        user.favourite.artists.push(req.body.artist);
      }
    }
    await user.save();
    let message = added ? "Added to Favourites" : "Removed from favourites";
    res.status(200).json(wrapperMessage("success", message, user));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

module.exports = router;
