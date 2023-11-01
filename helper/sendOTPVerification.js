const otplib = require("otplib");
const axios = require("axios");
const wrapperMessage = require("../helper/wrapperMessage");
const bcrypt = require("bcrypt");

const OTPVerification = require("../model/otpVerification");

const secret = otplib.authenticator.generateSecret();
otplib.authenticator.options = { digits: 6 };
const sendOTPVerification = async ({ _id, phoneNumber }, res) => {
  try {
    const otp = otplib.authenticator.generate(secret);

    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
    const newOTPVerification = await new OTPVerification({
      userId: _id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000, //10 min deadline to enter otp
    });
    await newOTPVerification.save();

    const body = {
      Text: `User Admin login OTP is ${otp} - ${process.env.SENDER_ID}`,
      Number: phoneNumber,
      SenderId: process.env.SENDER_ID,
      DRNotifyUrl: "https://www.domainname.com/notifyurl",
      DRNotifyHttpMethod: "POST",
      Tool: "API",
    };

    // Sends SMS OTP to user.
    // const data = await await axios.post(
    //   `https://restapi.smscountry.com/v0.1/Accounts/${process.env.AUTH_KEY}/SMSes/`,
    //   body,
    //   {
    //     auth: {
    //       username: process.env.AUTH_KEY,
    //       password: process.env.AUTH_TOKEN,
    //     },
    //   }
    // );

    res.json({
      status: "pending",
      message: "OTP message sent",
      data: {
        userId: _id,
        phoneNumber,
        otp,
      },
    });
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
};

module.exports = sendOTPVerification;
