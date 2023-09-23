const fast2sms = require("fast-two-sms");
const otplib = require('otplib');
const secret = otplib.authenticator.generateSecret();

// Generate an OTP
const token = otplib.authenticator.generate(secret);
var options = {
  authorization : "OVG2Xfy9eM5WxaokSuZ4Fs6cTNdqhUKwptCljvrLm1gQP7JBi3y3rk1V29GOPtfQEwl5TKjxX0ivqzUD", //fill this with your api
  message: `your OTP verification code is ${token}`,
  numbers: ['8178049784'],
};
//send this message
fast2sms
  .sendMessage(options)
  .then((response) => {
    console.log("otp sent successfully");
    console.log("Response", response);
  })
  .catch((error) => {
    console.log(error);
  });