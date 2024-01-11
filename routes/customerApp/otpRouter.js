const router = require("express").Router();
const User = require("../../model/customerApp/User");
const OTPVerification = require("../../model/otpVerification");
const bcrypt = require("bcrypt");
const sendOTPVerification = require("../../helper/sendOTPVerification");
const wrapperMessage = require("../../helper/wrapperMessage");
const jwt = require("jsonwebtoken");
// Verify OTP

router.post("/verify", async (req, res) => {
  try {
    let { userId, otp } = req.body;
    if (!userId || !otp) {
      throw Error("Empty otp details are not allowed");
    } else {
      let OTPVerificationRecords = await OTPVerification.find({
        userId,
      });
      if (OTPVerificationRecords.length <= 0) {
        // no record found
        throw new Error(
          "Account record doesn't exist or has been verified already. Please sign up or log in."
        );
      } else {
        // user OTP record exists
        const { expiresAt } = OTPVerificationRecords[0];
        const hashedOtp = OTPVerificationRecords[0].otp;

        if (expiresAt < Date.now()) {
          // user OTP record has expired
          await OTPVerification.deleteMany({ userId });
          throw new Error("Code has expired. Please request again.");
        } else {
          const validOTP = await bcrypt.compare(otp, hashedOtp);

          if (!validOTP) {
            throw new Error("Invalid code passed. Please enter valid OTP.");
          } else {
            let data = await User.updateOne({ _id: userId }, { verified: true });
            let userData = await User.find({_id: userId});
            if(!userData.length){
              throw new Error("No such user Exists!");
            }
            await OTPVerification.deleteMany({ userId });
            let user = {
              id: userData[0]._id,
              name: userData[0].name,
              email: userData[0].email,
              phoneNumber: userData[0].phoneNumber,
              verified: userData[0].verified,
            };
            const accessToken = jwt.sign(
              user,
              process.env.ACCESS_TOKEN_SECRET
            );
            user = { ...user, accessToken };
            if(user.name === ''){
              user = {...user, newUser: true}
            }else{
              user = {...user, newUser: false}
            }
            res.json(wrapperMessage("success", "", user));
          }
        }
      }
    }
  } catch (err) {
    res.json(wrapperMessage("failed", err.message));
  }
});

// Resend OTP

router.post("/resend", async (req, res) => {
  try {
    let { userId, phoneNumber } = req.body;

    if (!userId || !phoneNumber) {
      throw Error("Empty user details are not allowed!");
    } else {
      // deleting existing records and resending OTP
      await OTPVerification.deleteMany({ userId });
      sendOTPVerification({ _id: userId, phoneNumber }, res);
    }
  } catch (error) {
    res.json(wrapperMessage("failed", error.message));
  }
});

router.post("/changePassword", async (req, res) => {
  try {
    let { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) {
      throw Error("Empty otp details are not allowed");
    } else {
      let OTPVerificationRecords = await OTPVerification.find({
        userId,
      });
      if (OTPVerificationRecords.length <= 0) {
        // no record found
        throw new Error("Account record doesn't exist. Please retry.");
      } else {
        // user OTP record exists
        const { expiresAt } = OTPVerificationRecords[0];
        const hashedOtp = OTPVerificationRecords[0].otp;

        if (expiresAt < Date.now()) {
          // user OTP record has expired
          await OTPVerification.deleteMany({ userId });
          throw new Error("Code has expired. Please request again.");
        } else {
          const validOTP = await bcrypt.compare(otp, hashedOtp);

          if (!validOTP) {
            throw new Error("Invalid code passed. Please enter valid OTP.");
          } else {
            const saltRounds = 10;
            const hashedNewPassword = await bcrypt.hash(
              newPassword,
              saltRounds
            );

            await User.updateOne(
              { _id: userId },
              { password: hashedNewPassword }
            );
            await OTPVerification.deleteMany({ userId });
            res.json({
              status: "success",
              message: "User password successfully changed.",
            });
          }
        }
      }
    }
  } catch (err) {
    res.json(wrapperMessage("failed", err.message));
  }
});

module.exports = router;
