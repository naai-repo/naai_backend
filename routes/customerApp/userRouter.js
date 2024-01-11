const router = require("express").Router();
const bcrypt = require("bcrypt");


const User = require("../../model/customerApp/User");
const wrapperMessage = require("../../helper/wrapperMessage");
const sendOTPVerification = require("../../helper/sendOTPVerification");

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
          phoneNumber
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

router.post('/update', async (req,res) => {
  try{
    let {userId, data} = req.body;
    if(data.name){
      if(!/^[a-zA-Z ]*$/.test(data.name)){
        throw new Error("Please enter a Valid name!");  
      }
    }
    if(data.email){
      let userEmail = await User.findOne({ email: data.email});
      if(userEmail && userEmail._id.toString()  !== userId){
        throw new Error("This email is already registered!");
      }
    }
    let userData = await User.findOne({_id: userId});
    if(!userData){
      throw new Error("No such user exits!");
    }
    let result = await User.updateOne({_id: userId}, data);
    res.json(wrapperMessage("success", result))
  }catch(err){
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
})

module.exports = router;
