const otplib = require("otplib");
const bcrypt = require("bcrypt");
const wrapperMessage = require("../helper/wrapperMessage");
const CommonUtils = require("./commonUtils");
const sendMail = require("./sendMail");
const axios = require("axios");
const OTPVerification = require("../model/otpVerification");

otplib.authenticator.options = { digits: 6 };

const generateOTP = () => {
  const secret = otplib.authenticator.generateSecret();
  const otp = otplib.authenticator.generate(secret);
  return otp;
};

const hashOTP = async (otp) => {
  const saltRounds = 6;
  return await bcrypt.hash(otp, saltRounds);
};

const createOTPVerificationRecord = async (userId, hashedOtp) => {
  const newOTPVerification = new OTPVerification({
    userId,
    otp: hashedOtp,
    createdAt: Date.now(),
    expiresAt: Date.now() + 600000, // 10 min deadline to enter OTP
  });
  return await newOTPVerification.save();
};

const sendOTPVerification = async ({ _id, phoneNumber, email }, res) => {
  try {
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await createOTPVerificationRecord(_id, hashedOtp);

    CommonUtils.sendOTPonNumber(phoneNumber);
    sendMail(otp, email, "One Time Password (OTP) for Login", "login-otp");

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
    res.json(wrapperMessage("failed", err.message));
  }
};

module.exports = sendOTPVerification;
